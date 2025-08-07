import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProcessOrdersButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessOrders = async () => {
    setIsProcessing(true);
    try {
      console.log('[PROCESS] Iniciando processamento de pedidos pendentes...');
      
      const { data, error } = await supabase.functions.invoke('process-pending-orders');
      
      if (error) {
        throw error;
      }
      
      console.log('[PROCESS] Resultado:', data);
      
      if (data.success) {
        toast.success(`${data.processed_orders} pedido(s) processado(s) com sucesso!`);
        
        // Mostrar detalhes se houver
        if (data.results && data.results.length > 0) {
          const successCount = data.results.filter((r: any) => !r.error).length;
          const errorCount = data.results.filter((r: any) => r.error).length;
          
          if (errorCount > 0) {
            toast.warning(`${successCount} processados, ${errorCount} com erro. Verifique os logs.`);
          }
        }
      } else {
        toast.error('Erro no processamento: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('[PROCESS] Erro:', error);
      toast.error('Erro ao processar pedidos: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleProcessOrders}
      disabled={isProcessing}
      variant="outline"
      size="sm"
    >
      {isProcessing ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      {isProcessing ? 'Processando...' : 'Processar Pendentes'}
    </Button>
  );
};