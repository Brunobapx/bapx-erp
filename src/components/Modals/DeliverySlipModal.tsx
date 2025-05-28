
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
import { Printer, Download } from 'lucide-react';
import { toast } from "sonner";

type DeliverySlipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
};

export const DeliverySlipModal = ({ 
  isOpen, 
  onClose, 
  saleData
}: DeliverySlipModalProps) => {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (isOpen && saleData) {
      setDeliveryAddress('');
      setObservations('');
    }
  }, [isOpen, saleData]);

  const generateDeliverySlip = () => {
    if (!deliveryAddress.trim()) {
      toast.error('Endereço de entrega é obrigatório');
      return;
    }

    setIsGenerating(true);
    
    // Simular geração do romaneio
    setTimeout(() => {
      toast.success('Romaneio gerado com sucesso!');
      setIsGenerating(false);
    }, 1000);
  };

  const printToPDF = () => {
    if (!deliveryAddress.trim()) {
      toast.error('Gere o romaneio primeiro');
      return;
    }

    // Simular impressão em PDF
    const printContent = `
      <html>
        <head>
          <title>Romaneio de Entrega - ${saleData?.sale_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .signature { margin-top: 50px; border-top: 1px solid #000; width: 300px; text-align: center; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ROMANEIO DE ENTREGA</h1>
            <h2>Nº ${saleData?.sale_number || ''}</h2>
          </div>
          
          <div class="info-section">
            <h3>Dados da Venda</h3>
            <div class="info-row"><span><strong>Venda:</strong> ${saleData?.sale_number || ''}</span></div>
            <div class="info-row"><span><strong>Pedido:</strong> ${saleData?.order_number || ''}</span></div>
            <div class="info-row"><span><strong>Cliente:</strong> ${saleData?.client_name || ''}</span></div>
            <div class="info-row"><span><strong>Valor Total:</strong> R$ ${saleData?.total_amount?.toLocaleString('pt-BR') || ''}</span></div>
            <div class="info-row"><span><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</span></div>
          </div>

          <div class="info-section">
            <h3>Endereço de Entrega</h3>
            <p>${deliveryAddress}</p>
          </div>

          ${observations ? `
          <div class="info-section">
            <h3>Observações</h3>
            <p>${observations}</p>
          </div>
          ` : ''}

          <div class="signature">
            <p>Assinatura do Responsável</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast.success('Romaneio enviado para impressão');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Romaneio de Entrega</DialogTitle>
          <DialogDescription>
            Preencha os dados para gerar o romaneio de entrega.
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
            <Label htmlFor="delivery-address">Endereço de Entrega *</Label>
            <Textarea 
              id="delivery-address" 
              placeholder="Digite o endereço completo de entrega..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
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
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            variant="secondary" 
            onClick={printToPDF} 
            disabled={isGenerating || !deliveryAddress.trim()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir PDF
          </Button>
          <Button onClick={generateDeliverySlip} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Gerar Romaneio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
