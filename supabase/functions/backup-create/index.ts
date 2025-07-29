import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupMetadata {
  version: string;
  created_at: string;
  created_by: string;
  total_tables: number;
  total_records: number;
  size_bytes: number;
}

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

    const { type = 'manual' } = await req.json();

    console.log('Iniciando criação de backup...');

    // Lista de todas as tabelas para backup
    const tables = [
      'accounts_payable',
      'clients',
      'commission_payments',
      'conciliacoes',
      'delivery_routes',
      'extrato_bancario_importado',
      'financial_accounts',
      'financial_categories',
      'financial_entries',
      'fiscal_invoices',
      'markup_settings',
      'nota_configuracoes',
      'nota_logs',
      'notas_emitidas',
      'order_items',
      'orders',
      'packaging',
      'payment_methods',
      'payment_terms',
      'perdas',
      'product_categories',
      'product_recipes',
      'production',
      'products',
      'purchase_items',
      'purchases',
      'route_assignments',
      'route_items',
      'sales',
      'seller_commissions',
      'service_order_attachments',
      'service_order_materials',
      'service_orders',
      'system_modules',
      'system_settings',
      'system_sub_modules',
      'troca_itens',
      'trocas'
    ];

    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    // Exportar dados de cada tabela
    for (const table of tables) {
      try {
        console.log(`Exportando tabela: ${table}`);
        
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Erro ao exportar tabela ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        totalRecords += (data || []).length;
        
        console.log(`Tabela ${table}: ${(data || []).length} registros`);
      } catch (error) {
        console.error(`Erro ao processar tabela ${table}:`, error);
        backupData[table] = [];
      }
    }

    // Criar metadados do backup
    const metadata: BackupMetadata = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      created_by: 'system',
      total_tables: tables.length,
      total_records: totalRecords,
      size_bytes: 0
    };

    // Estrutura final do backup
    const backupStructure = {
      metadata,
      data: backupData,
      schema_version: '1.0.0'
    };

    // Converter para JSON
    const backupJson = JSON.stringify(backupStructure, null, 2);
    const sizeBytes = new TextEncoder().encode(backupJson).length;
    
    // Atualizar metadados com tamanho
    backupStructure.metadata.size_bytes = sizeBytes;
    
    // Gerar nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    console.log(`Backup criado: ${totalRecords} registros, ${Math.round(sizeBytes / 1024)} KB`);

    // Salvar registro do backup (opcional)
    try {
      await supabase.from('backup_history').insert({
        filename,
        type,
        status: 'completed',
        size_bytes: sizeBytes,
        total_records: totalRecords,
        metadata: backupStructure.metadata
      });
    } catch (error) {
      console.error('Erro ao salvar histórico de backup:', error);
    }

    // Retornar arquivo para download
    return new Response(JSON.stringify(backupStructure, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': sizeBytes.toString(),
      },
    });

  } catch (error) {
    console.error('Erro na criação do backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});