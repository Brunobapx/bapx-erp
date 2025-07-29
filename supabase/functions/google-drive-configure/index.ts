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

    const config = await req.json();

    console.log('Salvando configuração do Google Drive:', config);

    // Salvar configuração no sistema
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'google_drive_backup_config',
        value: config,
        category: 'backup',
        description: 'Configuração de backup automático no Google Drive'
      });

    if (error) {
      console.error('Erro ao salvar configuração:', error);
      return new Response(JSON.stringify({ 
        error: 'Erro ao salvar configuração',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se backup automático foi habilitado, configurar cron job
    if (config.enabled) {
      await configureAutomaticBackup(config.frequency);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuração salva com sucesso'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na configuração do Google Drive:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function configureAutomaticBackup(frequency: string) {
  // Configurar cron job baseado na frequência
  const cronExpression = getCronExpression(frequency);
  
  console.log(`Configurando backup automático: ${frequency} (${cronExpression})`);
  
  // Aqui você configuraria o cron job do Supabase
  // Por enquanto, apenas logamos a configuração
}

function getCronExpression(frequency: string): string {
  switch (frequency) {
    case 'daily':
      return '0 2 * * *'; // Todo dia às 2h
    case 'weekly':
      return '0 2 * * 0'; // Todo domingo às 2h
    case 'monthly':
      return '0 2 1 * *'; // Todo dia 1 do mês às 2h
    default:
      return '0 2 * * *'; // Padrão: diário
  }
}