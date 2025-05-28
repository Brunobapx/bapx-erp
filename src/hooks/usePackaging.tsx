
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
  production_id: string;
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
  order_number?: string;
  client_name?: string;
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
          .select(`
            *,
            production!inner(
              order_item_id,
              order_items!inner(
                order_id,
                orders!inner(
                  order_number,
                  client_name
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name
        const packagingsWithOrderInfo = (data || []).map(pack => ({
          ...pack,
          order_number: pack.production?.order_items?.orders?.order_number || '',
          client_name: pack.production?.order_items?.orders?.client_name || ''
        }));
        
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
        
        // Primeiro, atualizar a embalagem
        const { error: updateError } = await supabase
          .from('packaging')
          .update(updateData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Buscar dados completos da embalagem e produção
        const { data: packagingData, error: packagingError } = await supabase
          .from('packaging')
          .select(`
            *,
            production!inner(
              order_item_id,
              order_items!inner(
                order_id,
                quantity,
                unit_price,
                total_price,
                orders!inner(
                  id,
                  order_number,
                  client_id,
                  client_name,
                  total_amount
                )
              )
            )
          `)
          .eq('id', id)
          .single();
        
        if (packagingError) throw packagingError;
        
        const orderData = packagingData.production.order_items.orders;
        const finalQuantity = quantityPackaged || packagingData.quantity_packaged || packagingData.quantity_to_package;
        
        // Verificar se já existe uma venda para este pedido
        const { data: existingSale, error: saleCheckError } = await supabase
          .from('sales')
          .select('id')
          .eq('order_id', orderData.id)
          .maybeSingle();
        
        if (saleCheckError) {
          console.error('Erro ao verificar venda existente:', saleCheckError);
        }
        
        if (!existingSale) {
          // Gerar número da venda
          const saleNumber = `VDA-${Date.now().toString().slice(-6)}`;
          
          // Criar nova venda com a quantidade embalada
          const { error: saleError } = await supabase
            .from('sales')
            .insert({
              user_id: user?.id,
              sale_number: saleNumber,
              order_id: orderData.id,
              client_id: orderData.client_id,
              client_name: orderData.client_name,
              total_amount: orderData.total_amount,
              status: 'pending'
            });
          
          if (saleError) {
            console.error('Erro ao criar venda:', saleError);
            toast.error('Erro ao criar venda');
          } else {
            console.log(`Venda ${saleNumber} criada com sucesso - Quantidade embalada: ${finalQuantity}`);
            toast.success(`Embalagem aprovada! Venda ${saleNumber} criada com ${finalQuantity} unidades`);
          }
        } else {
          toast.success('Embalagem aprovada');
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
