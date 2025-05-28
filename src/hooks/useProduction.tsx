import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ProductionStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export type Production = {
  id: string;
  production_number: string;
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: ProductionStatus;
  start_date?: string;
  completion_date?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  order_number?: string;
  client_name?: string;
};

export const useProduction = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
          .from('production')
          .select(`
            *,
            order_items!inner(
              order_id,
              orders!inner(
                order_number,
                client_name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Mapear os dados para incluir order_number e client_name
        const productionsWithOrderInfo = (data || []).map(prod => ({
          ...prod,
          order_number: prod.order_items?.orders?.order_number || '',
          client_name: prod.order_items?.orders?.client_name || ''
        }));
        
        setProductions(productionsWithOrderInfo);
      } catch (error: any) {
        console.error('Erro ao carregar produção:', error);
        setError(error.message || 'Erro ao carregar produção');
        toast.error('Erro ao carregar produção');
      } finally {
        setLoading(false);
      }
    };

    fetchProductions();
  }, [refreshTrigger]);

  const refreshProductions = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updateProductionStatus = async (id: string, status: ProductionStatus, quantityProduced?: number) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'in_progress') {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }
      
      if (status === 'completed' || status === 'approved') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        if (quantityProduced !== undefined) {
          updateData.quantity_produced = quantityProduced;
        }
      }
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_by = user?.email || 'Sistema';
        
        // Primeiro, atualizar a produção com a quantidade produzida
        const { error: updateError } = await supabase
          .from('production')
          .update(updateData)
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Agora criar o registro de embalagem com a quantidade aprovada
        if (quantityProduced && quantityProduced > 0) {
          // Buscar dados da produção atualizada
          const { data: productionData, error: fetchError } = await supabase
            .from('production')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fetchError) {
            console.error('Erro ao buscar dados da produção:', fetchError);
            throw fetchError;
          }
          
          // Verificar se já existe um registro de embalagem para esta produção
          const { data: existingPackaging, error: checkError } = await supabase
            .from('packaging')
            .select('id')
            .eq('production_id', id)
            .maybeSingle();
          
          if (checkError) {
            console.error('Erro ao verificar embalagem existente:', checkError);
          }
          
          if (existingPackaging) {
            // Atualizar o registro existente
            const { error: packagingUpdateError } = await supabase
              .from('packaging')
              .update({
                quantity_to_package: quantityProduced,
                status: 'pending',
                updated_at: new Date().toISOString()
              })
              .eq('production_id', id);
            
            if (packagingUpdateError) {
              console.error('Erro ao atualizar embalagem:', packagingUpdateError);
              toast.error('Erro ao atualizar registro de embalagem');
            } else {
              console.log('Embalagem atualizada com sucesso com quantidade:', quantityProduced);
              toast.success('Produção aprovada e quantidade atualizada na embalagem');
            }
          } else {
            // Criar novo registro de embalagem
            const { error: packagingError } = await supabase
              .from('packaging')
              .insert({
                user_id: user?.id,
                production_id: id,
                product_id: productionData.product_id,
                product_name: productionData.product_name,
                quantity_to_package: quantityProduced,
                quantity_packaged: 0,
                status: 'pending'
              });
            
            if (packagingError) {
              console.error('Erro ao criar embalagem:', packagingError);
              toast.error('Erro ao criar registro de embalagem');
            } else {
              console.log('Embalagem criada com sucesso com quantidade:', quantityProduced);
              toast.success('Produção aprovada e enviada para embalagem');
            }
          }
        }
        
        refreshProductions();
        return true;
      }

      // Para outros status, apenas atualizar a produção normalmente
      const { error } = await supabase
        .from('production')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Status de produção atualizado com sucesso');
      refreshProductions();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar produção:', error);
      toast.error('Erro ao atualizar produção');
      return false;
    }
  };

  return {
    productions,
    loading,
    error,
    refreshProductions,
    updateProductionStatus
  };
};
