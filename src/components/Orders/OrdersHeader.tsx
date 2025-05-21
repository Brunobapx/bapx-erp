
import React from 'react';
import { Button } from "@/components/ui/button";
import { Package } from 'lucide-react';

interface OrdersHeaderProps {
  onCreateOrder: () => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onCreateOrder }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
      </div>
      <Button onClick={onCreateOrder}>
        <Package className="mr-2 h-4 w-4" /> Novo Pedido
      </Button>
    </div>
  );
};
