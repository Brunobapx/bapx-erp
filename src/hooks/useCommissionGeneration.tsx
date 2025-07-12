import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { CommissionData } from '@/components/Reports/CommissionTable';

export const useCommissionGeneration = () => {
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const handleSelectionChange = (commissionId: string, selected: boolean) => {
    setSelectedCommissions(prev => {
      if (selected) {
        return [...prev, commissionId];
      } else {
        return prev.filter(id => id !== commissionId);
      }
    });
  };

  const handleSelectAll = (commissions: CommissionData[]) => {
    setSelectedCommissions(commissions.map(c => c.id));
  };

  const handleClearAll = () => {
    setSelectedCommissions([]);
  };

  const getSelectedTotal = (commissions: CommissionData[]) => {
    return commissions
      .filter(c => selectedCommissions.includes(c.id))
      .reduce((sum, c) => sum + c.commission_amount, 0);
  };

  const getGroupedCommissions = (commissions: CommissionData[]) => {
    const selected = commissions.filter(c => selectedCommissions.includes(c.id));
    
    // Agrupar por vendedor
    const grouped = selected.reduce((acc, commission) => {
      const sellerId = commission.seller_name; // Usando nome como chave por simplicidade
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller_name: commission.seller_name,
          commissions: [],
          total_commission: 0
        };
      }
      acc[sellerId].commissions.push(commission);
      acc[sellerId].total_commission += commission.commission_amount;
      return acc;
    }, {} as Record<string, {
      seller_name: string;
      commissions: CommissionData[];
      total_commission: number;
    }>);

    return Object.values(grouped);
  };

  const generateCommissions = async (commissions: CommissionData[]) => {
    if (!user || selectedCommissions.length === 0) return;

    try {
      setGenerating(true);
      console.log('[COMMISSION_GENERATION] Iniciando geração de comissões...');

      const groupedCommissions = getGroupedCommissions(commissions);
      console.log('[COMMISSION_GENERATION] Comissões agrupadas por vendedor:', groupedCommissions);

      for (const group of groupedCommissions) {
        // Buscar o ID real do vendedor baseado no nome
        const knownSellers = {
          'Thor Albuquerque': '50813b14-8b0c-40cf-a55c-76bf2a4a19b1',
          'Nathalia Albuquerque': '6c0bf94a-f544-4452-9aaf-9a702c028967'
        };
        
        const sellerId = knownSellers[group.seller_name as keyof typeof knownSellers];
        
        if (!sellerId) {
          console.error('ID do vendedor não encontrado para:', group.seller_name);
          continue;
        }

        // Criar entrada em accounts_payable primeiro
        const { data: payableData, error: payableError } = await supabase
          .from('accounts_payable')
          .insert({
            user_id: user.id,
            supplier_name: group.seller_name,
            description: `Pagamento de comissões - ${group.seller_name}`,
            amount: group.total_commission,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
            category: 'Comissões',
            status: 'pending'
          })
          .select()
          .single();

        if (payableError) throw payableError;

        // Criar registro de commission_payment
        const { error: commissionError } = await supabase
          .from('commission_payments')
          .insert({
            user_id: user.id,
            seller_id: sellerId,
            seller_name: group.seller_name,
            total_commission: group.total_commission,
            order_ids: group.commissions.map(c => c.order_number),
            commission_details: {
              commissions: group.commissions.map(c => ({
                id: c.id,
                order_number: c.order_number,
                client_name: c.client_name,
                sale_date: c.sale_date,
                total_amount: c.total_amount,
                commission_amount: c.commission_amount,
                commission_percentage: c.commission_percentage
              }))
            },
            accounts_payable_id: payableData.id,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          });

        if (commissionError) throw commissionError;

        console.log('[COMMISSION_GENERATION] Comissão gerada para:', group.seller_name);
      }

      toast.success(`${groupedCommissions.length} pagamento(s) de comissão gerado(s) com sucesso!`);
      setSelectedCommissions([]); // Limpar seleção
      return true;
    } catch (error: any) {
      console.error('Erro ao gerar comissões:', error);
      toast.error('Erro ao gerar pagamento de comissões');
      return false;
    } finally {
      setGenerating(false);
    }
  };

  return {
    selectedCommissions,
    generating,
    handleSelectionChange,
    handleSelectAll,
    handleClearAll,
    getSelectedTotal,
    generateCommissions
  };
};