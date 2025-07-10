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
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';

type FiscalEmissionModalProps = {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  saleData: any;
};

export const FiscalEmissionModal = ({ 
  isOpen, 
  onClose, 
  saleData
}: FiscalEmissionModalProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && saleData) {
      // Buscar próximo número da NFe
      getNextInvoiceNumber();
      
      // Montar observações com dados da venda
      let obs = `Venda ${saleData.sale_number} - Pedido ${saleData.order_number}`;
      
      // Adicionar forma de pagamento se existir
      if (saleData.payment_method) {
        obs += ` | Forma de pagamento: ${saleData.payment_method}`;
      }
      
      // Adicionar prazo de pagamento se existir
      if (saleData.payment_term) {
        obs += ` | Prazo: ${saleData.payment_term}`;
      }
      
      setObservations(obs);
    }
  }, [isOpen, saleData]);

  const getNextInvoiceNumber = async () => {
    try {
      // Buscar configuração da numeração inicial
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'nfe_initial_number')
        .single();

      let initialNumber = 1;
      if (!settingsError && settings) {
        try {
          initialNumber = parseInt(JSON.parse(settings.value as string)) || 1;
        } catch {
          initialNumber = 1;
        }
      }

      // Buscar a última nota fiscal emitida
      const { data: lastInvoice, error: invoiceError } = await supabase
        .from('fiscal_invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = initialNumber;
      
      if (!invoiceError && lastInvoice?.invoice_number) {
        // Extrair número da última nota e incrementar
        const lastNumber = parseInt(lastInvoice.invoice_number) || 0;
        nextNumber = Math.max(lastNumber + 1, initialNumber);
      }

      setInvoiceNumber(nextNumber.toString());
    } catch (error) {
      console.error('Erro ao buscar próximo número da NFe:', error);
      // Em caso de erro, usar 1 como padrão
      setInvoiceNumber('1');
    }
  };

  const handleEmitNFe = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Número da nota fiscal é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('=== INÍCIO EMISSÃO NFE ===');
      console.log('Dados da venda:', saleData);
      console.log('Número da NFe:', invoiceNumber);
      console.log('Observações:', observations);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Sessão obtida:', !!session);

      const requestBody = {
        action: 'emit_nfe',
        data: {
          sale_id: saleData.id,
          invoice_number: invoiceNumber,
          observations
        }
      };

      console.log('Body da requisição:', requestBody);

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('Resposta completa do edge function:', { data, error });

      if (error) {
        console.error('Erro do edge function:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('Dados de erro:', data);
        throw new Error(data?.error || data?.message || 'Erro ao emitir nota fiscal');
      }

      console.log('NFe emitida com sucesso:', data);
      toast.success('Nota fiscal enviada para processamento no Focus NFe!');
      onClose(true);
    } catch (error) {
      console.error('=== ERRO NA EMISSÃO NFE ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      console.error('Stack trace:', error.stack);
      
      let errorMessage = 'Erro ao emitir nota fiscal';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      console.error('Mensagem final do erro:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkNFeStatus = async () => {
    if (!saleData?.sale_number) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'check_nfe_status',
          data: {
            reference: saleData.sale_number
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.status) {
        const status = data.status;
        
        if (status.status === 'autorizado') {
          toast.success('NFe autorizada com sucesso!');
          // Aqui você pode abrir o PDF ou XML da nota
        } else if (status.status === 'erro_autorizacao') {
          toast.error(`Erro na autorização: ${status.mensagem_erro}`);
        } else {
          toast.info(`Status: ${status.status}`);
        }
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      toast.error(error.message || 'Erro ao consultar status da NFe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emitir Nota Fiscal Eletrônica
          </DialogTitle>
          <DialogDescription>
            Emissão via Focus NFe - Os dados serão enviados para processamento
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
              placeholder="Informações adicionais para a NFe..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• A emissão é assíncrona - aguarde o processamento</li>
              <li>• Verifique se os dados da empresa estão completos</li>
              <li>• Use números sequenciais para as notas fiscais</li>
              <li>• Consulte o status após alguns minutos</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="outline" 
            onClick={checkNFeStatus}
            disabled={isSubmitting || !saleData?.sale_number}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Consultar Status'}
          </Button>
          <Button onClick={handleEmitNFe} disabled={isSubmitting || !invoiceNumber.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Emitindo...
              </>
            ) : (
              'Emitir NFe'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};