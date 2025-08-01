import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from 'lucide-react';
import { Order } from '@/hooks/useOrders';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  order: Order | null;
  loading?: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  loading = false
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancelar Pedido
          </DialogTitle>
          <DialogDescription>
            Confirme o cancelamento do pedido <strong>{order.order_number}</strong>.
            <br />
            <br />
            <span className="text-sm text-green-600">
              ✓ Os itens serão devolvidos automaticamente ao estoque
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do cancelamento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Itens que serão devolvidos ao estoque:</h4>
              <div className="space-y-1">
                {order.order_items.map((item, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    • {item.product_name}: <span className="font-medium">{item.quantity} unidade(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};