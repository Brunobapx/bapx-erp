import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/components/Auth/AuthProvider';

export const useFinancialCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { user } = useAuth();

  const cleanupDuplicateEntries = async () => {
    try {
      setIsCleaningUp(true);
      console.log('[CLEANUP] Iniciando limpeza de lançamentos duplicados...');
      
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar lançamentos duplicados (gestão colaborativa)
      const { data: duplicates, error } = await supabase
        .from('financial_entries')
        .select('*')
        .eq('type', 'receivable')
        .not('sale_id', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`[CLEANUP] Total de lançamentos encontrados: ${duplicates?.length || 0}`);

      // Agrupar por sale_id
      const groupedBySale: { [key: string]: any[] } = {};
      duplicates?.forEach(entry => {
        if (entry.sale_id) {
          if (!groupedBySale[entry.sale_id]) {
            groupedBySale[entry.sale_id] = [];
          }
          groupedBySale[entry.sale_id].push(entry);
        }
      });

      let cleanedCount = 0;
      const saleIds = Object.keys(groupedBySale);
      
      console.log(`[CLEANUP] Verificando ${saleIds.length} vendas para duplicatas...`);

      // Para cada venda, manter apenas o lançamento mais completo
      for (const saleId of saleIds) {
        const saleEntries = groupedBySale[saleId];
        
        if (saleEntries.length > 1) {
          console.log(`[CLEANUP] Venda ${saleId}: ${saleEntries.length} lançamentos encontrados`);
          
          // Ordenar por qualidade da descrição (mais completa primeiro)
          saleEntries.sort((a, b) => {
            const aComplete = a.description?.includes(' - ') && a.description?.split(' - ').length >= 3;
            const bComplete = b.description?.includes(' - ') && b.description?.split(' - ').length >= 3;
            
            if (aComplete && !bComplete) return -1;
            if (!aComplete && bComplete) return 1;
            
            // Se ambos são completos ou incompletos, ordenar por data (mais recente primeiro)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          // Manter o primeiro (mais completo/recente) e remover os outros
          const toKeep = saleEntries[0];
          const toRemove = saleEntries.slice(1);
          
          console.log(`[CLEANUP] Mantendo lançamento ${toKeep.id} (${toKeep.description})`);
          
          for (const entry of toRemove) {
            console.log(`[CLEANUP] Removendo lançamento ${entry.id} (${entry.description})`);
            
            const { error: deleteError } = await supabase
              .from('financial_entries')
              .delete()
              .eq('id', entry.id);
            
            if (deleteError) {
              console.error(`[CLEANUP] Erro ao deletar lançamento ${entry.id}:`, deleteError);
            } else {
              cleanedCount++;
            }
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`[CLEANUP] Limpeza concluída: ${cleanedCount} lançamentos duplicados removidos`);
        toast.success(`Limpeza concluída! ${cleanedCount} lançamentos duplicados foram removidos.`);
      } else {
        console.log(`[CLEANUP] Nenhum lançamento duplicado encontrado`);
        toast.info('Nenhum lançamento duplicado encontrado.');
      }

      return cleanedCount;
    } catch (error: any) {
      console.error('[CLEANUP] Erro na limpeza:', error);
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