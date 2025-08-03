
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Package, Cog, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OrdersHeaderProps {
  onCreateOrder?: () => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onCreateOrder }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleCreateOrder = () => {
    if (onCreateOrder) {
      onCreateOrder();
    } else {
      navigate('/pedidos/new');
    }
  };

  const handleProcessPendingOrders = async () => {
    setIsProcessing(true);
    try {
      console.log('[ORDERS-HEADER] Processando pedidos pendentes...');
      
      const { data, error } = await supabase.functions.invoke('process-pending-orders');
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('[ORDERS-HEADER] Resultado:', data);
      
      if (data.success) {
        toast.success(`${data.processed_orders} pedidos processados com sucesso!`);
        window.location.reload(); // Recarregar página para ver as mudanças
      } else {
        toast.error('Erro ao processar pedidos: ' + data.error);
      }
    } catch (error) {
      console.error('[ORDERS-HEADER] Erro:', error);
      toast.error('Erro ao processar pedidos: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleProcessPendingOrders}
          variant="outline"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Cog className="mr-2 h-4 w-4" />
          )}
          Processar Pendentes
        </Button>
        <Button onClick={handleCreateOrder}>
          <Package className="mr-2 h-4 w-4" /> Novo Pedido
        </Button>
      </div>
    </div>
  );
};
