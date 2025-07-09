import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export async function validateAuth(req: Request): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Token de autorização necessário' };
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: 'Token inválido' };
    }

    // Buscar role do usuário
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: roleData?.role || 'user'
      }
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { user: null, error: 'Erro na validação de autenticação' };
  }
}

export function createResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function createErrorResponse(message: string, status = 400) {
  return createResponse({ error: message, success: false }, status);
}

export function createSuccessResponse(data: any, message?: string) {
  return createResponse({ 
    data, 
    success: true, 
    message: message || 'Operação realizada com sucesso' 
  });
}