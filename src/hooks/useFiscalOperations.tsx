import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FiscalOperation {
  id: string;
  operation_type: string;
  operation_name: string;
  cfop_dentro_estado: string;
  cfop_fora_estado: string;
  cfop_exterior?: string;
  cfop?: string;
  description?: string;
  is_active: boolean;
}

export const useFiscalOperations = () => {
  const [operations, setOperations] = useState<FiscalOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_operations')
        .select('*')
        .eq('is_active', true)
        .order('operation_type');

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      console.error('Erro ao carregar operações fiscais:', error);
      toast.error('Erro ao carregar operações fiscais');
    } finally {
      setLoading(false);
    }
  };

  const saveOperation = async (operation: Partial<FiscalOperation>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const operationData = {
        ...operation,
        user_id: user.id,
      };

      if (operation.id) {
        const { error } = await supabase
          .from('fiscal_operations')
          .update(operationData)
          .eq('id', operation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fiscal_operations')
          .insert(operationData);
        if (error) throw error;
      }

      toast.success('Operação fiscal salva com sucesso!');
      loadOperations();
    } catch (error) {
      console.error('Erro ao salvar operação fiscal:', error);
      toast.error('Erro ao salvar operação fiscal');
    } finally {
      setSaving(false);
    }
  };

  const deleteOperation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_operations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Operação fiscal removida com sucesso!');
      loadOperations();
    } catch (error) {
      console.error('Erro ao remover operação fiscal:', error);
      toast.error('Erro ao remover operação fiscal');
    }
  };

  const getCfopForOperation = (operationType: string, clientState: string, companyState: string) => {
    const operation = operations.find(op => op.operation_type === operationType);
    if (!operation) return '5102'; // CFOP padrão

    if (clientState === companyState) {
      return operation.cfop_dentro_estado || operation.cfop || '5102';
    } else {
      return operation.cfop_fora_estado || operation.cfop || '6102';
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  return {
    operations,
    loading,
    saving,
    saveOperation,
    deleteOperation,
    getCfopForOperation,
    reload: loadOperations
  };
};