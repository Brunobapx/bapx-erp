import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "create-company" is up and running!`);

async function createCompanyInDB(supabaseAdmin: SupabaseClient, formData: any) {
  const { 
    name, subdomain, billing_email, plan_id,
    logo_url, primary_color, secondary_color,
    admin_email, admin_password, admin_first_name, admin_last_name,
    whatsapp, trial_expires_at
  } = formData;

  // Calcular próximo código sequencial da empresa (01, 02, 03...)
  const { data: lastCompany } = await supabaseAdmin
    .from('companies')
    .select('code')
    .order('code', { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastNum = lastCompany?.code ? parseInt(lastCompany.code, 10) : 0;
  const nextCode = String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(2, '0');

  // 1. Criar empresa
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert({
        name,
        subdomain: subdomain || null,
        code: nextCode,
        billing_email: billing_email || null,
        logo_url,
        primary_color,
        secondary_color,
        onboarded_at: new Date().toISOString(),
        trial_expires_at: trial_expires_at ? new Date(trial_expires_at).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        whatsapp: whatsapp || null,
        plan: plan_id || null,
    })
    .select()
    .single();

  if (companyError || !company) {
      console.error('DB Error: Failed to create company row.', companyError);
      throw companyError || new Error('Erro ao criar a empresa no banco de dados.');
  }
  console.log(`Company row created: ${company.id}`);

  let createdAuthUserId: string | null = null;
  try {
    // 2. Criar usuário admin
    console.log(`Attempting to create auth user for ${admin_email}`);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: {
            first_name: admin_first_name,
            last_name: admin_last_name,
        }
    });
    if (authError || !authUser?.user) {
        console.error('Auth Error: Failed to create admin user.', authError);
        throw authError || new Error('Erro ao criar o usuário administrador.');
    }
    createdAuthUserId = authUser.user.id;
    console.log(`Auth user created: ${createdAuthUserId}`);
    
    // 3. Criar/Atualizar perfil
    // Um gatilho no banco pode ter criado um perfil básico. Usamos o upsert para garantir que os dados corretos sejam salvos.
    console.log(`Upserting profile for user ${createdAuthUserId}`);
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: createdAuthUserId,
            first_name: admin_first_name,
            last_name: admin_last_name,
            company_id: company.id,
            // A role é gerenciada na tabela user_roles
        });
    if (profileError) {
        console.error('DB Error: Failed to upsert profile.', profileError);
        throw profileError;
    }
    console.log(`Profile upserted for user ${createdAuthUserId}`);

    // 4. Atribuir role de admin
    console.log(`Assigning role 'admin' to user ${createdAuthUserId}`);
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: createdAuthUserId,
        role: 'admin'
    });
    if (roleError) {
        console.error('DB Error: Failed to assign role.', roleError);
        throw roleError;
    }
    console.log(`Role 'admin' assigned to user ${createdAuthUserId}`);

    // 5. Ativar assinatura (opcional - ignora erro se tabela não existir)
    try {
      console.log(`Creating subscription for company ${company.id}`);
      const { error: subscriptionError } = await supabaseAdmin
        .from('company_subscriptions')
        .insert({
          company_id: company.id,
          plan_id: plan_id || null,
          status: 'active',
          starts_at: new Date().toISOString(),
        });
      if (subscriptionError) {
        console.warn('Optional: skipping subscription creation.', subscriptionError);
      } else {
        console.log(`Subscription created for company ${company.id}`);
      }
    } catch (e) {
      console.warn('Optional: failed to create subscription (non-fatal).', e);
    }
    
    return company;

  } catch (err) {
    console.error(`Error during post-company creation. Initiating rollback for company ${company.id}.`, err);
    if (createdAuthUserId) {
        console.log(`Rolling back auth user: ${createdAuthUserId}`);
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }
    console.log(`Rolling back company row: ${company.id}`);
    await supabaseAdmin.from('companies').delete().eq('id', company.id);
    throw err;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { formData } = await req.json();
    const { subdomain, billing_email, admin_email, admin_password, plan_id, name, admin_first_name, admin_last_name } = formData;

    if (!name || !admin_email || !admin_password || !plan_id || !admin_first_name) {
      throw new Error("Preencha todos os campos obrigatórios");
    }
    if (admin_password.length < 6) {
      throw new Error("A senha deve ter no mínimo 6 caracteres.");
    }

    // Debugging logs
    console.log("Checking environment variables...");
    console.log("SUPABASE_URL available:", !!Deno.env.get('SUPABASE_URL'));
    console.log("SUPABASE_SERVICE_ROLE_KEY available:", !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        } 
      }
    );
    
    console.log("Supabase admin client initialized.");
    
    const orConditions: string[] = [];
    if (subdomain && String(subdomain).trim() !== '') {
      orConditions.push(`subdomain.eq.${subdomain}`);
    }
    if (billing_email && String(billing_email).trim() !== '') {
      orConditions.push(`billing_email.eq.${billing_email}`);
    }

    let existing = null;
    if (orConditions.length > 0) {
      const { data: existingData, error: existingError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .or(orConditions.join(','))
        .maybeSingle();
      if (existingError) throw existingError;
      existing = existingData;
    }

    if (existing) {
      return new Response(JSON.stringify({ error: 'Já existe uma empresa com esses dados (subdomínio/email de cobrança).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    console.log("No existing company found. Proceeding to create...");
    const company = await createCompanyInDB(supabaseAdmin, formData);
    console.log("Company creation process finished successfully.");
    
    return new Response(JSON.stringify({ company }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in create-company function:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
