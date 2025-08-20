import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, MessageCircle, Printer, Loader2 } from "lucide-react";
import { Quote } from "@/hooks/useQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from "@/integrations/supabase/client";

interface QuotePreviewProps {
  quote: Quote;
}

export const QuotePreview = ({ quote }: QuotePreviewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);

  const generatePDFBase64 = async (): Promise<string | null> => {
    if (!printRef.current) return null;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('datauristring').split(',')[1]; // Retorna apenas a parte base64
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      setIsGeneratingPDF(true);
      toast.info('Gerando PDF...');
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`orcamento-${quote.quote_number}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!quote.client_email) {
      toast.error('Cliente não possui e-mail cadastrado');
      return;
    }

    try {
      setIsSendingEmail(true);
      toast.info('Preparando e-mail...');

      // Gerar PDF em base64
      const pdfBase64 = await generatePDFBase64();
      
      if (!pdfBase64) {
        throw new Error('Erro ao gerar PDF');
      }

      toast.info('Enviando e-mail...');

      // Chamar edge function para enviar e-mail
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quote: {
            id: quote.id,
            quote_number: quote.quote_number,
            client_name: quote.client_name,
            client_email: quote.client_email,
            total_amount: quote.total_amount,
            valid_until: quote.valid_until,
            payment_method: quote.payment_method,
            payment_term: quote.payment_term,
            notes: quote.notes,
            items: quote.items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              description: item.description
            }))
          },
          pdfBase64
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`E-mail enviado com sucesso para ${quote.client_email}!`);
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      toast.error(`Erro ao enviar e-mail: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!quote.client_phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const message = `🧾 *Orçamento ${quote.quote_number}*

Olá, ${quote.client_name}! 😊

Conforme solicitado, segue o orçamento para sua análise:

📋 *Detalhes:*
• Número: ${quote.quote_number}
• Válido até: ${format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
${quote.payment_method ? `• Pagamento: ${quote.payment_method}` : ''}
${quote.payment_term ? `• Prazo: ${quote.payment_term}` : ''}

💰 *Valor Total: R$ ${quote.total_amount.toFixed(2)}*

📋 *Itens:*
${quote.items.map((item, index) => 
  `${index + 1}. ${item.product_name} - Qtd: ${item.quantity} - R$ ${item.total_price.toFixed(2)}`
).join('\n')}

${quote.notes ? `\n📝 *Observações:*\n${quote.notes}` : ''}

Ficamos à disposição para esclarecer qualquer dúvida! 

Para mais detalhes, entre em contato conosco.

*BAPX ERP* - Sistema de Gestão Empresarial`;

    // Limpar telefone removendo caracteres especiais
    const phone = quote.client_phone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
    
    const whatsappLink = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    toast.success('Redirecionando para WhatsApp...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="gap-2">
          {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF'}
        </Button>
        <Button variant="outline" onClick={handleSendEmail} disabled={isSendingEmail || !quote.client_email} className="gap-2">
          {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {isSendingEmail ? 'Enviando...' : 'Enviar por E-mail'}
        </Button>
        <Button variant="outline" onClick={handleSendWhatsApp} disabled={!quote.client_phone} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          Enviar WhatsApp
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-0">
          <div ref={printRef} className="bg-white min-h-[297mm]" style={{ pageBreakInside: 'avoid' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">ORÇAMENTO</h1>
                  <div className="text-primary-foreground/90">
                    <p className="text-lg font-semibold">{quote.quote_number}</p>
                    <p>Data: {format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    <p>Válido até: {format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-2xl font-bold">R$ {quote.total_amount.toFixed(2)}</p>
                    <p className="text-sm opacity-90">Valor Total</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Company & Client Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    DADOS DA EMPRESA
                  </h3>
                  <div className="space-y-1 text-gray-600">
                    <p className="font-semibold text-gray-800">BAPX ERP</p>
                    <p>Sistema de Gestão Empresarial</p>
                    <p>contato@bapxerp.com</p>
                    <p>(11) 9999-9999</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    DADOS DO CLIENTE
                  </h3>
                  <div className="space-y-1 text-gray-600">
                    <p className="font-semibold text-gray-800">{quote.client_name}</p>
                    {quote.client_email && <p>{quote.client_email}</p>}
                    {quote.client_phone && <p>{quote.client_phone}</p>}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  ITENS DO ORÇAMENTO
                </h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Qtd
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Valor Unit.
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quote.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-900">
                            R$ {item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                            R$ {item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">R$ {quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.discount_amount && quote.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Desconto ({quote.discount_percentage}%):
                        </span>
                        <span className="font-medium text-red-600">
                          - R$ {quote.discount_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">R$ {quote.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {(quote.payment_method || quote.payment_term) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    CONDIÇÕES DE PAGAMENTO
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {quote.payment_method && (
                      <p className="text-sm"><strong>Forma de Pagamento:</strong> {quote.payment_method}</p>
                    )}
                    {quote.payment_term && (
                      <p className="text-sm"><strong>Prazo:</strong> {quote.payment_term}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {quote.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    OBSERVAÇÕES
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
                <p>Este orçamento é válido até {format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: ptBR })}.</p>
                <p className="mt-2">Gerado automaticamente pelo BAPX ERP - Sistema de Gestão Empresarial</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};