import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, MessageCircle, Printer } from "lucide-react";
import { Quote } from "@/hooks/useQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QuotePreviewProps {
  quote: Quote;
}

export const QuotePreview = ({ quote }: QuotePreviewProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
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
    }
  };

  const handleSendEmail = () => {
    if (!quote.client_email) {
      toast.error('Cliente não possui e-mail cadastrado');
      return;
    }

    const subject = `Orçamento ${quote.quote_number} - ${quote.client_name}`;
    const body = `Prezado(a) ${quote.client_name},

Segue em anexo o orçamento solicitado.

Orçamento: ${quote.quote_number}
Valor Total: R$ ${quote.total_amount.toFixed(2)}
Válido até: ${format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: ptBR })}

Aguardamos seu retorno.

Atenciosamente,
BAPX ERP`;

    const mailtoLink = `mailto:${quote.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleSendWhatsApp = () => {
    if (!quote.client_phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const message = `*Orçamento ${quote.quote_number}*

Olá ${quote.client_name}!

Segue o orçamento solicitado:

💰 *Valor Total:* R$ ${quote.total_amount.toFixed(2)}
📅 *Válido até:* ${format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: ptBR })}

${quote.payment_method ? `💳 *Forma de Pagamento:* ${quote.payment_method}` : ''}
${quote.payment_term ? `⏰ *Prazo:* ${quote.payment_term}` : ''}

Aguardamos seu retorno! 😊`;

    const phone = quote.client_phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
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
        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
        <Button variant="outline" onClick={handleSendEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Enviar por E-mail
        </Button>
        <Button variant="outline" onClick={handleSendWhatsApp} className="gap-2">
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