import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type PackagingStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Packaging = {
  id: string;
  packaging_number: string;
  production_id: string | null;
  product_id: string;
  product_name: string;
  quantity_to_package: number;
  quantity_packaged: number;
  status: PackagingStatus;
  packaged_by?: string;
  packaged_at?: string;
  approved_by?: string;
  approved_at?: string;
  quality_check: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_id?: string;
  client_id?: string;
  client_name?: string;
  order_number?: string;
};

export const usePackaging = () => {
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPackagings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('packaging')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name
        const packagingsWithOrderInfo = (data || []).map((pack) => {
          // Se tem order_id e client_name diretamente (embalagem direta do estoque)
          if (pack.order_id && pack.client_name) {
            return {
              ...pack,
              order_number: `Pedido-${pack.order_id.slice(-6)}`,
              client_name: pack.client_name
            };
          }
          
          // Sistema antigo - fallback
          return {
            ...pack,
            order_number: 'EMBALAGEM',
            client_name: 'Sistema'
          };
        });
        
        setPackagings(packagingsWithOrderInfo);
      } catch (error: any) {
        console.error('Erro ao carregar embalagem:', error);
        setError(error.message || 'Erro ao carregar embalagem');
        toast.error('Erro ao carregar embalagem');
      } finally {
        setLoading(false);
      }
    };

    fetchPackagings();
  }, [refreshTrigger]);

  const refreshPackagings = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updatePackagingStatus = async (
    id: string, 
    status: PackagingStatus, 
    quantityPackaged?: number,
    qualityCheck?: boolean
  ) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (quantityPackaged !== undefined) {
        updateData.quantity_packaged = quantityPackaged;
      }
      
      if (qualityCheck !== undefined) {
        updateData.quality_check = qualityCheck;
      }
      
      if (status === 'completed') {
        updateData.packaged_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.packaged_by = user?.email || 'Sistema';
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.email || 'Sistema';
        
        // Atualizar embalagem como aprovada
        const { error: updateError } = await supabase
          .from('packaging')
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;

        // Buscar os dados completos da embalagem incluindo tracking_id
        const { data: packagingData, error: packagingError } = await supabase
          .from('packaging')
          .select('*')
          .eq('id', id)
          .single();
        
        if (packagingError) throw packagingError;

        const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
        
        console.log(`[TRACKING] Aprovando embalagem: ${finalQuantity} unidades de ${packagingData.product_name}`);

        // Se tem tracking_id, usar novo sistema
        if (packagingData.tracking_id) {
          console.log(`[TRACKING] Atualizando tracking ${packagingData.tracking_id} com ${finalQuantity} unidades aprovadas`);
          
          // Atualizar tracking com quantidade final aprovada
          const { error: trackingError } = await supabase
            .from('order_item_tracking')
            .update({
              quantity_packaged_approved: finalQuantity,
              status: 'complete_ready'
            })
            .eq('id', packagingData.tracking_id);
            
          if (trackingError) {
            console.error('Erro ao atualizar tracking:', trackingError);
            toast.error('Erro ao atualizar rastreamento do item');
            return false;
          }

          // Buscar dados do tracking para recalcular valores
          const { data: trackingData, error: trackingFetchError } = await supabase
            .from('order_item_tracking')
            .select(`
              *,
              order_items!inner(
                id,
                order_id,
                unit_price,
                orders!inner(
                  id,
                  client_id,
                  client_name
                )
              )
            `)
            .eq('id', packagingData.tracking_id)
            .single();
            
          if (trackingFetchError) {
            console.error('Erro ao buscar tracking:', trackingFetchError);
            toast.error('Erro ao buscar dados do tracking');
            return false;
          }

          // Recalcular valor do item baseado na quantidade aprovada
          const orderItem = trackingData.order_items;
          const newTotalPrice = finalQuantity * orderItem.unit_price;
          
          // Atualizar item do pedido com quantidade e valor final
          const { error: itemUpdateError } = await supabase
            .from('order_items')
            .update({
              quantity: finalQuantity,
              total_price: newTotalPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderItem.id);
            
          if (itemUpdateError) {
            console.error('Erro ao atualizar item do pedido:', itemUpdateError);
            toast.error('Erro ao atualizar item do pedido');
            return false;
          }

          console.log(`[TRACKING] Item atualizado: ${orderItem.id} - ${finalQuantity} unidades, valor: R$ ${newTotalPrice.toFixed(2)}`);
          
          if (finalQuantity < trackingData.quantity_target) {
            toast.warning(`Quantidade ajustada: ${trackingData.quantity_target} → ${finalQuantity} unidades`);
          }

          toast.success(`Embalagem aprovada! ${finalQuantity} unidades processadas.`);
          
        } else {
          // Sistema antigo - embalagem sem tracking
          toast.success(`Embalagem aprovada! ${finalQuantity} unidades de ${packagingData.product_name} processadas.`);
        }
        
        refreshPackagings();
        return true;
      }

      const { error } = await supabase
        .from('packaging')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de embalagem atualizado com sucesso');
      refreshPackagings();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar embalagem:', error);
      toast.error('Erro ao atualizar embalagem');
      return false;
    }
  };

  return {
    packagings,
    loading,
    error,
    refreshPackagings,
    updatePackagingStatus
  };
};