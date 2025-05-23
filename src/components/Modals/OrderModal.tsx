
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Order } from '@/hooks/useOrders';
import { useNavigate } from 'react-router-dom';

interface OrderModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, orderData }) => {
  const navigate = useNavigate();
  
  // Handle modal close
  const handleCloseModal = () => {
    onClose();
  };
  
  // Handle view details - go to the order page
  const handleViewDetails = () => {
    if (orderData && orderData.id) {
      navigate(`/pedidos/${orderData.id}`);
    }
    onClose();
  };

  // Get first order item for display
  const firstItem = orderData?.order_items?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
        </DialogHeader>
        
        {orderData && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente:</p>
                <p className="font-medium">{orderData.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produto:</p>
                <p className="font-medium">{firstItem?.product_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantidade:</p>
                <p className="font-medium">{firstItem?.quantity || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status:</p>
                <p className="font-medium">{orderData.status}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                className="text-blue-500 hover:text-blue-700 text-sm"
                onClick={handleViewDetails}
              >
                Ver detalhes completos
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
