import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

export interface CommissionPayment {
  id: string;
  user_id: string;
  seller_id: string;
  seller_name: string;
  payment_number: string;
  total_commission: number;
  order_ids: string[];
  commission_details: any;
  accounts_payable_id: string | null;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useGeneratedCommissions = () => {
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadCommissionPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('[GENERATED_COMMISSIONS] Carregando comissões geradas...');

      const { data, error } = await supabase
        .from('commission_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[GENERATED_COMMISSIONS] Comissões carregadas:', data?.length);
      setCommissionPayments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar comissões geradas:', error);
      toast.error('Erro ao carregar comissões geradas');
    } finally {
      setLoading(false);
    }
  };

  const cancelCommissionPayment = async (paymentId: string) => {
    try {
      console.log('[GENERATED_COMMISSIONS] Cancelando pagamento:', paymentId);

      // Buscar o pagamento para pegar o accounts_payable_id
      const { data: payment, error: fetchError } = await supabase
        .from('commission_payments')
        .select('accounts_payable_id')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar status para cancelado
      const { error: updateError } = await supabase
        .from('commission_payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Se tem accounts_payable_id, também cancelar o lançamento
      if (payment.accounts_payable_id) {
        const { error: payableError } = await supabase
          .from('accounts_payable')
          .update({ status: 'cancelled' })
          .eq('id', payment.accounts_payable_id);

        if (payableError) {
          console.warn('Erro ao cancelar contas a pagar:', payableError);
        }
      }

      toast.success('Pagamento de comissão cancelado com sucesso');
      loadCommissionPayments(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao cancelar pagamento:', error);
      toast.error('Erro ao cancelar pagamento de comissão');
    }
  };

  useEffect(() => {
    loadCommissionPayments();
  }, [user]);

  return {
    commissionPayments,
    loading,
    cancelCommissionPayment,
    refreshCommissionPayments: loadCommissionPayments
  };
};