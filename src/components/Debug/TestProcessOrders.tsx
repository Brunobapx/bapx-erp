import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestProcessOrders = () => {
  const testProcessFunction = async () => {
    try {
      console.log('[TEST] Iniciando teste da edge function...');
      
      const { data, error } = await supabase.functions.invoke('process-pending-orders');
      
      console.log('[TEST] Resposta da function:', { data, error });
      
      if (error) {
        toast.error('Erro: ' + error.message);
      } else {
        toast.success('Sucesso: ' + JSON.stringify(data));
      }
    } catch (err) {
      console.error('[TEST] Erro:', err);
      toast.error('Erro: ' + err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Teste - Processar Pedidos</h2>
      <Button onClick={testProcessFunction}>
        Testar Edge Function
      </Button>
    </div>
  );
};

export default TestProcessOrders;