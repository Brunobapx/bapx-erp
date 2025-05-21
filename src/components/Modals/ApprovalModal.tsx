
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stage: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route';
  orderData?: any;
};

export const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  stage,
  orderData = { 
    id: 'PED-001', 
    product: 'Widget XYZ', 
    quantity: 50, 
    customer: 'Acme Corp' 
  }
}: ApprovalModalProps) => {
  const [notes, setNotes] = React.useState('');
  const [quantity, setQuantity] = React.useState(orderData.quantity.toString());

  const stageConfig = {
    order: {
      title: 'Aprovar Pedido',
      description: 'Confirme os detalhes do pedido antes de aprovar.',
      primaryAction: 'Aprovar Pedido',
      secondaryAction: 'Enviar para Produção',
      showQuantity: false,
    },
    production: {
      title: 'Aprovar Produção',
      description: 'Confirme os detalhes da produção antes de aprovar.',
      primaryAction: 'Aprovar Produção',
      secondaryAction: 'Enviar para Embalagem',
      showQuantity: true,
    },
    packaging: {
      title: 'Confirmar Embalagem',
      description: 'Confirme a quantidade produzida e embalada.',
      primaryAction: 'Confirmar Embalagem',
      secondaryAction: 'Liberar para Venda',
      showQuantity: true,
    },
    sales: {
      title: 'Confirmar Venda',
      description: 'Confirme os detalhes da venda para gerar lançamento financeiro.',
      primaryAction: 'Confirmar Venda',
      secondaryAction: 'Enviar para Financeiro',
      showQuantity: false,
    },
    finance: {
      title: 'Aprovar Financeiro',
      description: 'Confirme os detalhes financeiros antes de aprovar.',
      primaryAction: 'Aprovar Financeiro',
      secondaryAction: 'Liberar para Entrega',
      showQuantity: false,
    },
    route: {
      title: 'Confirmar Rota de Entrega',
      description: 'Defina a rota de entrega para este pedido.',
      primaryAction: 'Confirmar Rota',
      secondaryAction: 'Finalizar Pedido',
      showQuantity: false,
    },
  };

  const config = stageConfig[stage];

  const handleApprove = () => {
    toast.success(`${config.title} realizado com sucesso!`);
    onClose();
  };

  const handleSecondaryAction = () => {
    toast.success(`Pedido enviado para a próxima etapa.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order-id">Pedido</Label>
              <Input id="order-id" value={orderData.id} readOnly />
            </div>
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <Input id="customer" value={orderData.customer} readOnly />
            </div>
          </div>
          
          <div>
            <Label htmlFor="product">Produto</Label>
            <Input id="product" value={orderData.product} readOnly />
          </div>
          
          {config.showQuantity && (
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input 
                id="quantity" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              placeholder="Adicione observações se necessário..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" onClick={handleSecondaryAction}>
            {config.secondaryAction}
          </Button>
          <Button onClick={handleApprove}>{config.primaryAction}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
