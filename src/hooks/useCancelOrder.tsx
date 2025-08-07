import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCancelOrder = () => {
  const [loading, setLoading] = useState(false);

  const cancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    if (!orderId) {
      toast.error('ID do pedido é obrigatório');
      return false;
    }

    setLoading(true);
    
    try {
      console.log(`[useCancelOrder] Cancelando pedido ${orderId}${reason ? ` - Motivo: ${reason}` : ''}`);
      
      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: { orderId, reason }
      });

      if (error) {
        console.error('[useCancelOrder] Erro na edge function:', error);
        toast.error('Erro ao cancelar pedido: ' + (error.message || 'Erro desconhecido'));
        return false;
      }

      if (data?.error) {
        console.error('[useCancelOrder] Erro retornado pela função:', data.error);
        toast.error(data.error);
        return false;
      }

      console.log('[useCancelOrder] Pedido cancelado com sucesso:', data);
      
      toast.success(data.message || 'Pedido cancelado com sucesso!', {
        description: `Estoque atualizado: ${data.stockUpdates || 0} produtos, ${data.stockMovements || 0} movimentos registrados`
      });
      
      return true;
    } catch (error: any) {
      console.error('[useCancelOrder] Erro geral:', error);
      toast.error('Erro ao cancelar pedido: ' + (error.message || 'Erro desconhecido'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    cancelOrder,
    loading
  };
};