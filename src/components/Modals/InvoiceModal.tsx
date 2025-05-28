
import React, { useState } from 'react';
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

type InvoiceModalProps = {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  saleData: any;
  onEmitInvoice?: (data: any) => void;
};

export const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  saleData,
  onEmitInvoice
}: InvoiceModalProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && saleData) {
      setInvoiceNumber('');
      setObservations('');
    }
  }, [isOpen, saleData]);

  const handleEmitInvoice = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Número da nota fiscal é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceData = {
        ...saleData,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        observations,
        status: 'invoiced'
      };
      
      if (onEmitInvoice) {
        await onEmitInvoice(invoiceData);
      }
      
      toast.success('Nota fiscal emitida com sucesso!');
      onClose(true);
    } catch (error) {
      console.error('Erro ao emitir nota fiscal:', error);
      toast.error('Erro ao emitir nota fiscal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Emitir Nota Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados para emissão da nota fiscal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sale-number">Venda</Label>
              <Input 
                id="sale-number" 
                value={saleData?.sale_number || ''} 
                readOnly 
              />
            </div>
            <div>
              <Label htmlFor="order-number">Pedido</Label>
              <Input 
                id="order-number" 
                value={saleData?.order_number || ''} 
                readOnly 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input 
              id="client" 
              value={saleData?.client_name || ''} 
              readOnly 
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Valor Total</Label>
            <Input 
              id="amount" 
              value={saleData?.total_amount ? `R$ ${saleData.total_amount.toLocaleString('pt-BR')}` : ''} 
              readOnly 
            />
          </div>
          
          <div>
            <Label htmlFor="invoice-number">Número da Nota Fiscal *</Label>
            <Input 
              id="invoice-number" 
              placeholder="Ex: 001234"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea 
              id="observations" 
              placeholder="Observações adicionais..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleEmitInvoice} disabled={isSubmitting}>
            Emitir Nota Fiscal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
