import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  invitationId: string;
  companyName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, invitationId, companyName, role }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email);

    const inviteUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}/convite?invite=${invitationId}`;
    
    const roleTranslation = {
      'admin': 'Administrador',
      'user': 'Usuário',
      'master': 'Master'
    };

    const translatedRole = roleTranslation[role as keyof typeof roleTranslation] || role;

    const emailResponse = await resend.emails.send({
      from: "Sistema <noreply@resend.dev>",
      to: [email],
      subject: `Convite para ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Você foi convidado!</h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Você recebeu um convite para fazer parte da equipe da <strong>${companyName}</strong> 
              como <strong>${translatedRole}</strong>.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Para aceitar o convite e criar sua conta, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold; 
                        display: inline-block;">
                Aceitar Convite
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="font-size: 14px; color: #2563eb; word-break: break-all;">
              ${inviteUrl}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 12px; color: #64748b; text-align: center;">
              Este convite expira em 7 dias. Se você não solicitou este convite, 
              pode ignorar este email com segurança.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);