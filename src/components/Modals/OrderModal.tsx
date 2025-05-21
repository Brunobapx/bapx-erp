
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</DialogTitle>
        </DialogHeader>
        
        <OrderForm 
          orderData={orderData} 
          onClose={onClose} 
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onClose()}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
