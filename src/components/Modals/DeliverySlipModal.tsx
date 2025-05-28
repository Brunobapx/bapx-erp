
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
import { useClients } from '@/hooks/useClients';

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
  const [isGenerated, setIsGenerated] = useState(false);
  const { getClientById } = useClients();

  React.useEffect(() => {
    if (isOpen && saleData) {
      // Buscar dados do cliente e preencher endereço automaticamente
      const client = getClientById(saleData.client_id);
      let clientAddress = '';
      
      if (client) {
        const addressParts = [];
        if (client.address) addressParts.push(client.address);
        if (client.city) addressParts.push(client.city);
        if (client.state) addressParts.push(client.state);
        if (client.zip) addressParts.push(`CEP: ${client.zip}`);
        
        clientAddress = addressParts.join('\n');
      }
      
      setDeliveryAddress(clientAddress);
      setObservations('');
      setIsGenerated(false);
    }
  }, [isOpen, saleData, getClientById]);

  const generateDeliverySlip = () => {
    if (!deliveryAddress.trim()) {
      toast.error('Endereço de entrega é obrigatório');
      return;
    }

    setIsGenerating(true);
    
    // Simular geração do romaneio
    setTimeout(() => {
      setIsGenerated(true);
      toast.success('Romaneio gerado com sucesso!');
      setIsGenerating(false);
    }, 1000);
  };

  const downloadPDF = () => {
    if (!isGenerated) {
      toast.error('Gere o romaneio primeiro');
      return;
    }

    // Criar conteúdo HTML para o PDF
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Romaneio de Entrega - ${saleData?.sale_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              margin: 0;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 0;
              font-size: 18px;
              color: #666;
            }
            .info-section { 
              margin-bottom: 25px; 
            }
            .info-section h3 {
              background: #f0f0f0;
              padding: 8px;
              margin: 0 0 15px 0;
              border-left: 4px solid #333;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .info-row strong {
              min-width: 120px;
            }
            .signature { 
              margin-top: 60px; 
              border-top: 1px solid #000; 
              width: 300px; 
              text-align: center; 
              padding-top: 10px; 
            }
            .footer {
              position: fixed;
              bottom: 20px;
              right: 20px;
              font-size: 10px;
              color: #666;
            }
            .delivery-address {
              background: #f9f9f9;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            @media print {
              body { margin: 0; }
              .footer { position: absolute; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ROMANEIO DE ENTREGA</h1>
            <h2>Nº ${saleData?.sale_number || ''}</h2>
          </div>
          
          <div class="info-section">
            <h3>Dados da Venda</h3>
            <div class="info-row">
              <span><strong>Venda:</strong></span>
              <span>${saleData?.sale_number || ''}</span>
            </div>
            <div class="info-row">
              <span><strong>Pedido:</strong></span>
              <span>${saleData?.order_number || ''}</span>
            </div>
            <div class="info-row">
              <span><strong>Cliente:</strong></span>
              <span>${saleData?.client_name || ''}</span>
            </div>
            <div class="info-row">
              <span><strong>Valor Total:</strong></span>
              <span>R$ ${saleData?.total_amount?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || ''}</span>
            </div>
            <div class="info-row">
              <span><strong>Data:</strong></span>
              <span>${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Endereço de Entrega</h3>
            <div class="delivery-address">
              ${deliveryAddress.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${observations ? `
          <div class="info-section">
            <h3>Observações</h3>
            <div class="delivery-address">
              ${observations.replace(/\n/g, '<br>')}
            </div>
          </div>
          ` : ''}

          <div class="signature">
            <p>________________________________</p>
            <p><strong>Assinatura do Responsável pela Entrega</strong></p>
          </div>

          <div class="footer">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </body>
      </html>
    `;

    // Criar e abrir nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar o carregamento e então imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      
      toast.success('Romaneio enviado para download/impressão');
    } else {
      toast.error('Erro ao abrir janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    }
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
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="order-number">Pedido</Label>
              <Input 
                id="order-number" 
                value={saleData?.order_number || ''} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input 
              id="client" 
              value={saleData?.client_name || ''} 
              readOnly 
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Valor Total</Label>
            <Input 
              id="amount" 
              value={saleData?.total_amount ? `R$ ${saleData.total_amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : ''} 
              readOnly 
              className="bg-gray-50"
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
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea 
              id="observations" 
              placeholder="Observações adicionais para entrega..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
            />
          </div>

          {isGenerated && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✅ Romaneio gerado com sucesso! Agora você pode fazer o download em PDF.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button 
            variant="secondary" 
            onClick={downloadPDF} 
            disabled={!isGenerated || isGenerating}
          >
            <Printer className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button 
            onClick={generateDeliverySlip} 
            disabled={isGenerating || !deliveryAddress.trim()}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Gerando...' : 'Gerar Romaneio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
