
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
  onClose: (refresh?: boolean) => void;
  stage: 'order' | 'production' | 'packaging' | 'sales' | 'finance' | 'route';
  orderData?: any;
  onApprove?: (data: any) => void;
  onNextStage?: (data: any) => void;
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
  },
  onApprove,
  onNextStage
}: ApprovalModalProps) => {
  const [notes, setNotes] = React.useState('');
  const [quantity, setQuantity] = React.useState(orderData.quantity ? orderData.quantity.toString() : '0');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && orderData) {
      setNotes('');
      // Para embalagem, usar quantity_packaged se disponível, senão quantity_to_package
      if (stage === 'packaging') {
        const initialQuantity = orderData.quantity_packaged || orderData.quantity_to_package || orderData.quantity || 0;
        setQuantity(initialQuantity.toString());
      } else {
        setQuantity(orderData.quantity ? orderData.quantity.toString() : '0');
      }
    }
  }, [isOpen, orderData, stage]);

  const stageConfig = {
    order: {
      title: 'Aprovar Pedido',
      description: 'Confirme os detalhes do pedido antes de aprovar.',
      primaryAction: 'Aprovar Pedido',
      secondaryAction: 'Enviar para Produção',
      showQuantity: false,
      nextStage: 'production'
    },
    production: {
      title: 'Aprovar Produção',
      description: 'Confirme os detalhes da produção antes de aprovar.',
      primaryAction: 'Aprovar Produção',
      secondaryAction: 'Enviar para Embalagem',
      showQuantity: true,
      nextStage: 'packaging'
    },
    packaging: {
      title: 'Confirmar Embalagem',
      description: 'Confirme a quantidade embalada.',
      primaryAction: 'Confirmar Embalagem',
      secondaryAction: 'Liberar para Venda',
      showQuantity: true,
      quantityLabel: 'Quantidade Embalada',
      nextStage: 'sales'
    },
    sales: {
      title: 'Confirmar Venda',
      description: 'Confirme os detalhes da venda para gerar lançamento financeiro.',
      primaryAction: 'Confirmar Venda',
      secondaryAction: 'Enviar para Financeiro',
      showQuantity: false,
      nextStage: 'finance'
    },
    finance: {
      title: 'Aprovar Financeiro',
      description: 'Confirme os detalhes financeiros antes de aprovar.',
      primaryAction: 'Aprovar Financeiro',
      secondaryAction: 'Liberar para Entrega',
      showQuantity: false,
      nextStage: 'route'
    },
    route: {
      title: 'Confirmar Rota de Entrega',
      description: 'Defina a rota de entrega para este pedido.',
      primaryAction: 'Confirmar Rota',
      secondaryAction: 'Finalizar Pedido',
      showQuantity: false,
      nextStage: 'completed'
    },
  };

  const config = stageConfig[stage];

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const data = { 
        ...orderData, 
        notes, 
        quantityPackaged: parseInt(quantity),
        qualityCheck: true,
        status: `Aprovado ${config.title}`,
        updatedAt: new Date()
      };
      
      if (onApprove) {
        await onApprove(data);
      }
      
      toast.success(`${config.title} realizado com sucesso!`);
      onClose(true);
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao processar a aprovação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondaryAction = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        ...orderData,
        notes,
        quantityPackaged: parseInt(quantity),
        status: `Em ${config.nextStage}`,
        stage: config.nextStage,
        updatedAt: new Date()
      };
      
      if (onNextStage) {
        await onNextStage(data);
      }
      
      toast.success(`Pedido enviado para a próxima etapa: ${config.nextStage}`);
      onClose(true);
    } catch (error) {
      console.error('Erro ao enviar para próxima etapa:', error);
      toast.error('Erro ao processar a solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order-number">Pedido</Label>
              <Input 
                id="order-number" 
                value={orderData.order_number || orderData.id || ''} 
                readOnly 
              />
            </div>
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <Input 
                id="customer" 
                value={orderData.client_name || orderData.customer || ''} 
                readOnly 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="product">Produto</Label>
            <Input id="product" value={orderData.product || orderData.product_name || ''} readOnly />
          </div>
          
          {config.showQuantity && (
            <div>
              <Label htmlFor="quantity">{config.quantityLabel || 'Quantidade'}</Label>
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
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="secondary" onClick={handleSecondaryAction} disabled={isSubmitting}>
            {config.secondaryAction}
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>{config.primaryAction}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
