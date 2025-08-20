import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { validateAuth, corsHeaders, createResponse, createErrorResponse } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendQuoteEmailRequest {
  quote: {
    id: string;
    quote_number: string;
    client_name: string;
    client_email: string;
    total_amount: number;
    valid_until: string;
    payment_method?: string;
    payment_term?: string;
    notes?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      description?: string;
    }>;
  };
  pdfBase64?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse("Método não permitido", 405);
  }

  try {
    // Validar autenticação
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      return createErrorResponse(authError || "Não autenticado", 401);
    }

    const { quote, pdfBase64 }: SendQuoteEmailRequest = await req.json();

    if (!quote || !quote.client_email) {
      return createErrorResponse("Dados do orçamento ou e-mail do cliente não fornecidos", 400);
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(quote.client_email)) {
      return createErrorResponse("E-mail do cliente inválido", 400);
    }

    // Preparar conteúdo do e-mail
    const subject = `Orçamento ${quote.quote_number} - BAPX ERP`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 30px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: #f8fafc;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .quote-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th, .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .items-table th {
              background: #f1f5f9;
              font-weight: 600;
            }
            .total {
              background: #2563eb;
              color: white;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orçamento ${quote.quote_number}</h1>
            <p>BAPX ERP - Sistema de Gestão Empresarial</p>
          </div>
          
          <div class="content">
            <p>Prezado(a) <strong>${quote.client_name}</strong>,</p>
            
            <p>Esperamos que esteja bem! Segue em anexo o orçamento solicitado conforme nossa conversa.</p>
            
            <div class="quote-details">
              <h3>📋 Detalhes do Orçamento</h3>
              <p><strong>Número:</strong> ${quote.quote_number}</p>
              <p><strong>Válido até:</strong> ${new Date(quote.valid_until).toLocaleDateString('pt-BR')}</p>
              ${quote.payment_method ? `<p><strong>Forma de Pagamento:</strong> ${quote.payment_method}</p>` : ''}
              ${quote.payment_term ? `<p><strong>Prazo:</strong> ${quote.payment_term}</p>` : ''}
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.product_name}</strong>
                      ${item.description ? `<br><small style="color: #64748b;">${item.description}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.unit_price.toFixed(2)}</td>
                    <td><strong>R$ ${item.total_price.toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              💰 Valor Total: R$ ${quote.total_amount.toFixed(2)}
            </div>
            
            ${quote.notes ? `
              <div class="quote-details">
                <h3>📝 Observações</h3>
                <p>${quote.notes.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
            
            <p>Ficamos à disposição para esclarecer qualquer dúvida e aguardamos seu retorno.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe BAPX ERP</strong></p>
          </div>
          
          <div class="footer">
            <p>Este e-mail foi enviado automaticamente pelo BAPX ERP</p>
            <p>📧 contato@bapxerp.com | 📱 (11) 9999-9999</p>
          </div>
        </body>
      </html>
    `;

    // Preparar anexos se o PDF foi fornecido
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: `orcamento-${quote.quote_number}.pdf`,
        content: pdfBase64,
        content_type: 'application/pdf',
      });
    }

    // Enviar e-mail
    const emailResponse = await resend.emails.send({
      from: "BAPX ERP <noreply@bapxerp.com>",
      to: [quote.client_email],
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    });

    console.log("E-mail enviado com sucesso:", emailResponse);

    return createResponse({ 
      success: true, 
      message: "E-mail enviado com sucesso!",
      emailId: emailResponse.data?.id 
    });

  } catch (error: any) {
    console.error("Erro ao enviar e-mail:", error);
    return createErrorResponse(
      `Erro ao enviar e-mail: ${error.message || 'Erro desconhecido'}`, 
      500
    );
  }
};

serve(handler);