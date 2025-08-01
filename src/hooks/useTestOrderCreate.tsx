import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTestOrderCreate = () => {
  const [isTestingCreate, setIsTestingCreate] = useState(false);

  const testCreateOrder = async () => {
    setIsTestingCreate(true);
    
    try {
      console.log('[TEST] Iniciando teste via Edge Function...');
      
      // Testar via edge function que contorna problemas de cache do PostgREST
      const { data: result, error: edgeError } = await supabase.functions.invoke('test-order-insert');
      
      if (edgeError) {
        console.error('[TEST] Erro na edge function:', edgeError);
        throw new Error(`Edge function falhou: ${edgeError.message}`);
      }
      
      if (!result.success) {
        console.error('[TEST] Edge function retornou erro:', result.error);
        throw new Error(`Erro interno: ${result.error}`);
      }
      
      console.log('[TEST] Edge function funcionou!', result.data);
      toast.success(`Teste passou via Edge Function! ID: ${result.data.id}`);
      return result.data;
      
    } catch (error: any) {
      console.error('[TEST] Falha no teste de criação:', error);
      toast.error(`Teste falhou: ${error.message}`);
      throw error;
    } finally {
      setIsTestingCreate(false);
    }
  };

  return {
    testCreateOrder,
    isTestingCreate
  };
};