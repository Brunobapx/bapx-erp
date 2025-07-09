import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, createResponse, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    switch (req.method) {
      case 'POST':
        if (path === 'login') {
          const { email, password } = await req.json();
          
          if (!email || !password) {
            return createErrorResponse('Email e senha são obrigatórios');
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            return createErrorResponse('Credenciais inválidas', 401);
          }

          // Buscar dados do usuário
          const { data: profile } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          return createSuccessResponse({
            user: {
              id: data.user.id,
              email: data.user.email,
              role: profile?.role || 'user'
            },
            session: data.session,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }

        if (path === 'refresh') {
          const { refresh_token } = await req.json();
          
          if (!refresh_token) {
            return createErrorResponse('Refresh token é obrigatório');
          }

          const { data, error } = await supabase.auth.refreshSession({
            refresh_token
          });

          if (error) {
            return createErrorResponse('Refresh token inválido', 401);
          }

          return createSuccessResponse({
            session: data.session,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }
        break;

      case 'GET':
        if (path === 'profile') {
          const authHeader = req.headers.get('Authorization');
          if (!authHeader) {
            return createErrorResponse('Token de autorização necessário', 401);
          }

          const token = authHeader.split(' ')[1];
          const { data: { user }, error } = await supabase.auth.getUser(token);

          if (error || !user) {
            return createErrorResponse('Token inválido', 401);
          }

          // Buscar dados completos do usuário
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          return createSuccessResponse({
            id: user.id,
            email: user.email,
            role: roleData?.role || 'user',
            created_at: user.created_at
          });
        }
        break;
    }

    return createErrorResponse('Endpoint não encontrado', 404);
    
  } catch (error) {
    console.error('API Auth Error:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});