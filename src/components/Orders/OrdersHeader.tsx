
import React from 'react';
import { Button } from "@/components/ui/button";
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrdersHeaderProps {
  onCreateOrder?: () => void;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onCreateOrder }) => {
  const navigate = useNavigate();
  
  const handleCreateOrder = () => {
    if (onCreateOrder) {
      onCreateOrder();
    } else {
      navigate('/pedidos/new');
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
      </div>
      <Button onClick={handleCreateOrder}>
        <Package className="mr-2 h-4 w-4" /> Novo Pedido
      </Button>
    </div>
  );
};
