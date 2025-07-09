import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, validateAuth, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { user, error: authError } = await validateAuth(req);
  if (authError) {
    return createErrorResponse(authError, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const clientId = pathParts[pathParts.length - 1];

  try {
    switch (req.method) {
      case 'GET':
        if (clientId && clientId !== 'api-clients') {
          // Buscar cliente específico
          const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

          if (error) {
            return createErrorResponse('Cliente não encontrado', 404);
          }

          return createSuccessResponse(client);
        } else {
          // Listar clientes com filtros
          const search = url.searchParams.get('search');
          const type = url.searchParams.get('type');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          let query = supabase
            .from('clients')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('name');

          if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%,cnpj.ilike.%${search}%`);
          }

          if (type) {
            query = query.eq('type', type);
          }

          const { data: clients, error, count } = await query;

          if (error) {
            return createErrorResponse('Erro ao buscar clientes');
          }

          return createSuccessResponse({
            clients,
            total: count,
            limit,
            offset
          });
        }

      case 'POST':
        const clientData = await req.json();
        
        // Validações básicas
        if (!clientData.name) {
          return createErrorResponse('Nome é obrigatório');
        }
        if (!clientData.type || !['PF', 'PJ'].includes(clientData.type)) {
          return createErrorResponse('Tipo deve ser PF ou PJ');
        }

        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([{ ...clientData, user_id: user!.id }])
          .select()
          .single();

        if (createError) {
          return createErrorResponse('Erro ao criar cliente');
        }

        return createSuccessResponse(newClient, 'Cliente criado com sucesso');

      case 'PUT':
        if (!clientId || clientId === 'api-clients') {
          return createErrorResponse('ID do cliente é obrigatório');
        }

        const updateData = await req.json();
        delete updateData.id; // Não permitir alteração do ID
        delete updateData.user_id; // Não permitir alteração do user_id

        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', clientId)
          .select()
          .single();

        if (updateError) {
          return createErrorResponse('Erro ao atualizar cliente');
        }

        return createSuccessResponse(updatedClient, 'Cliente atualizado com sucesso');

      case 'DELETE':
        if (!clientId || clientId === 'api-clients') {
          return createErrorResponse('ID do cliente é obrigatório');
        }

        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (deleteError) {
          return createErrorResponse('Erro ao excluir cliente');
        }

        return createSuccessResponse(null, 'Cliente excluído com sucesso');

      default:
        return createErrorResponse('Método não permitido', 405);
    }
  } catch (error) {
    console.error('API Clients Error:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});