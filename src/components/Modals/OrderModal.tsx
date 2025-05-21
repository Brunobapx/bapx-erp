
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
import { useOrderForm } from '@/hooks/useOrderForm';
import { Order } from '@/hooks/useOrders';

interface OrderModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orderData }) => {
  const {
    handleSubmit,
    isSubmitting,
    isNewOrder
  } = useOrderForm({ orderData, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</DialogTitle>
        </DialogHeader>
        
        <OrderForm orderData={orderData} onClose={onClose} />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onClose()}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : (isNewOrder ? 'Criar Pedido' : 'Salvar Alterações')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
