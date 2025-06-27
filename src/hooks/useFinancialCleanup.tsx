
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFinancialCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const cleanupDuplicateEntries = async () => {
    try {
      setIsCleaningUp(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar todos os lançamentos financeiros do usuário
      const { data: entries, error } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'receivable')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por sale_id para encontrar duplicatas
      const groupedBySale: { [key: string]: any[] } = {};
      entries.forEach(entry => {
        if (entry.sale_id) {
          if (!groupedBySale[entry.sale_id]) {
            groupedBySale[entry.sale_id] = [];
          }
          groupedBySale[entry.sale_id].push(entry);
        }
      });

      let cleanedCount = 0;

      // Para cada grupo de lançamentos da mesma venda
      for (const saleId in groupedBySale) {
        const saleEntries = groupedBySale[saleId];
        
        if (saleEntries.length > 1) {
          console.log(`Encontrados ${saleEntries.length} lançamentos para venda ${saleId}`);
          
          // Encontrar o lançamento mais completo (com nome do cliente na descrição)
          const completeEntry = saleEntries.find(entry => 
            entry.description && 
            entry.description.includes(' - ') && 
            entry.description.split(' - ').length >= 3
          );
          
          if (completeEntry) {
            // Remover os lançamentos incompletos
            const incompleteEntries = saleEntries.filter(entry => entry.id !== completeEntry.id);
            
            for (const entry of incompleteEntries) {
              const { error: deleteError } = await supabase
                .from('financial_entries')
                .delete()
                .eq('id', entry.id);
              
              if (deleteError) {
                console.error('Erro ao deletar lançamento:', deleteError);
              } else {
                cleanedCount++;
                console.log(`Removido lançamento duplicado: ${entry.entry_number}`);
              }
            }
          }
        }
      }

      if (cleanedCount > 0) {
        toast.success(`Limpeza concluída! ${cleanedCount} lançamentos duplicados foram removidos.`);
      } else {
        toast.info('Nenhum lançamento duplicado encontrado.');
      }

      return cleanedCount;
    } catch (error: any) {
      console.error('Erro na limpeza:', error);
      toast.error('Erro ao limpar lançamentos duplicados: ' + error.message);
      return 0;
    } finally {
      setIsCleaningUp(false);
    }
  };

  return {
    cleanupDuplicateEntries,
    isCleaningUp
  };
};
