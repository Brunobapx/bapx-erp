
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { OrderForm } from "@/components/Orders/OrderForm";
import { Order } from '@/hooks/useOrders';

interface OrderModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orderData }) => {
  // Determine if we're creating a new order or editing an existing one
  const isNewOrder = !orderData?.id || orderData.id === 'NOVO';

  // Handle modal close
  const handleCloseModal = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</DialogTitle>
        </DialogHeader>
        
        <OrderForm 
          orderData={orderData} 
          onClose={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
};
