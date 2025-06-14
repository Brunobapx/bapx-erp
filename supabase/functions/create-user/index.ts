
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, role } = await req.json();

    // Apenas admin/master pode criar usuários. Checagem simples por header.
    const requesterRole = req.headers.get("x-requester-role");
    if (requesterRole !== "admin" && requesterRole !== "master") {
      return new Response(JSON.stringify({ error: "Permissão negada." }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const supabase_url = Deno.env.get("SUPABASE_URL");
    const service_role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Cria o usuário via API
    const response = await fetch(`${supabase_url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apiKey": service_role!,
        "Authorization": `Bearer ${service_role}`,
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        email_confirm: true,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.msg || data?.error_description || "Erro ao criar usuário" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Atualiza profile e roles
    const userId = data.user?.id;
    // Ativa perfil
    await fetch(`${supabase_url}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": service_role!,
        "Authorization": `Bearer ${service_role}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ is_active: true }),
    });
    // Define role principal
    await fetch(`${supabase_url}/rest/v1/user_roles?user_id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": service_role!,
        "Authorization": `Bearer ${service_role}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ role }),
    });

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno ao criar usuário." }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
