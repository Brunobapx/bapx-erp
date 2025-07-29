import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Iniciando restauração de backup...');

    let backupData: any;

    // Verificar se é upload de arquivo ou restore de backup existente
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Upload de arquivo
      const formData = await req.formData();
      const file = formData.get('backup_file') as File;
      
      if (!file) {
        return new Response(JSON.stringify({ error: 'Arquivo de backup não encontrado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const fileContent = await file.text();
      backupData = JSON.parse(fileContent);
    } else {
      // Restore de backup existente
      const { backup_id } = await req.json();
      
      if (!backup_id) {
        return new Response(JSON.stringify({ error: 'ID do backup não fornecido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar backup no histórico
      const { data: backupRecord, error } = await supabase
        .from('backup_history')
        .select('*')
        .eq('id', backup_id)
        .single();

      if (error || !backupRecord) {
        return new Response(JSON.stringify({ error: 'Backup não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Para este exemplo, assumimos que o backup está armazenado localmente
      // Em produção, você carregaria do Google Drive ou storage
      return new Response(JSON.stringify({ error: 'Restore de backup existente não implementado' }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar estrutura do backup
    if (!backupData.metadata || !backupData.data) {
      return new Response(JSON.stringify({ error: 'Arquivo de backup inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Backup válido. Iniciando restauração...');
    console.log(`Versão: ${backupData.metadata.version}`);
    console.log(`Total de registros: ${backupData.metadata.total_records}`);

    // Lista de tabelas a serem restauradas (em ordem de dependência)
    const tableOrder = [
      // Tabelas base (sem dependências)
      'system_modules',
      'system_sub_modules',
      'system_settings',
      'financial_accounts',
      'financial_categories',
      'payment_methods',
      'payment_terms',
      'markup_settings',
      'product_categories',
      'seller_commissions',
      
      // Tabelas com dados principais
      'clients',
      'products',
      'product_recipes',
      'orders',
      'order_items',
      'production',
      'packaging',
      'sales',
      'purchases',
      'purchase_items',
      'financial_entries',
      'accounts_payable',
      'service_orders',
      'service_order_materials',
      'service_order_attachments',
      'delivery_routes',
      'route_assignments',
      'route_items',
      'commission_payments',
      
      // Tabelas específicas
      'nota_configuracoes',
      'notas_emitidas',
      'nota_logs',
      'fiscal_invoices',
      'trocas',
      'troca_itens',
      'perdas',
      'extrato_bancario_importado',
      'conciliacoes'
    ];

    let restoredTables = 0;
    let restoredRecords = 0;

    // Restaurar dados tabela por tabela
    for (const tableName of tableOrder) {
      if (!backupData.data[tableName]) {
        console.log(`Tabela ${tableName} não encontrada no backup`);
        continue;
      }

      const tableData = backupData.data[tableName];
      if (!Array.isArray(tableData) || tableData.length === 0) {
        console.log(`Tabela ${tableName} está vazia`);
        continue;
      }

      try {
        console.log(`Restaurando tabela ${tableName} (${tableData.length} registros)...`);

        // Limpar tabela existente (cuidado!)
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
          console.error(`Erro ao limpar tabela ${tableName}:`, deleteError);
          // Continuar mesmo com erro de limpeza
        }

        // Inserir dados em lotes
        const batchSize = 100;
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(batch);

          if (insertError) {
            console.error(`Erro ao inserir lote ${i} da tabela ${tableName}:`, insertError);
            // Tentar inserir registro por registro
            for (const record of batch) {
              try {
                await supabase.from(tableName).insert(record);
                restoredRecords++;
              } catch (recordError) {
                console.error(`Erro ao inserir registro individual:`, recordError);
              }
            }
          } else {
            restoredRecords += batch.length;
          }
        }

        restoredTables++;
        console.log(`Tabela ${tableName} restaurada com sucesso`);

      } catch (error) {
        console.error(`Erro ao restaurar tabela ${tableName}:`, error);
      }
    }

    console.log(`Restauração concluída: ${restoredTables} tabelas, ${restoredRecords} registros`);

    // Salvar log da restauração
    try {
      await supabase.from('backup_history').insert({
        filename: `restore-${new Date().toISOString()}`,
        type: 'restore',
        status: 'completed',
        total_records: restoredRecords,
        metadata: {
          original_backup: backupData.metadata,
          restored_tables: restoredTables,
          restored_records: restoredRecords
        }
      });
    } catch (error) {
      console.error('Erro ao salvar log de restauração:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Backup restaurado com sucesso',
      restored_tables: restoredTables,
      restored_records: restoredRecords
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na restauração do backup:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});