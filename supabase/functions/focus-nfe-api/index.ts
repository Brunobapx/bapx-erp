import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'emitir_nfe':
        return await emitirNFe(supabase, user.id, payload);
      case 'consultar_status':
        return await consultarStatus(supabase, user.id, payload);
      case 'cancelar_nfe':
        return await cancelarNFe(supabase, user.id, payload);
      case 'obter_pdf':
        return await obterPDF(supabase, user.id, payload);
      case 'obter_xml':
        return await obterXML(supabase, user.id, payload);
      default:
        throw new Error('Ação não reconhecida');
    }
  } catch (error) {
    console.error('Erro na API Focus NFe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function emitirNFe(supabase: any, userId: string, payload: any) {
  const { pedidoId } = payload;

  // Buscar configurações
  const { data: config } = await supabase
    .from('nota_configuracoes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!config) {
    throw new Error('Configurações de nota fiscal não encontradas');
  }

  // Buscar dados do pedido
  const { data: pedido } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      clients(*)
    `)
    .eq('id', pedidoId)
    .single();

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  // Montar JSON da NFe conforme documentação Focus NFe
  const nfeData = {
    natureza_operacao: "Venda",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada_saida: new Date().toISOString().split('T')[0],
    tipo_documento: 1, // Saída
    finalidade_emissao: 1, // Normal
    cnpj_emitente: config.cnpj_emissor,
    nome_emitente: "Empresa Emitente", // Buscar dos dados da empresa
    logradouro_emitente: "Rua da Empresa",
    numero_emitente: "123",
    bairro_emitente: "Centro",
    municipio_emitente: "Cidade",
    uf_emitente: "UF",
    cep_emitente: "12345678",
    telefone_emitente: "11999999999",
    
    // Dados do destinatário
    cnpj_destinatario: pedido.clients?.cnpj || null,
    cpf_destinatario: pedido.clients?.cpf || null,
    nome_destinatario: pedido.clients?.name || pedido.client_name,
    logradouro_destinatario: pedido.clients?.address || "",
    numero_destinatario: pedido.clients?.number || "S/N",
    bairro_destinatario: pedido.clients?.bairro || "",
    municipio_destinatario: pedido.clients?.city || "",
    uf_destinatario: pedido.clients?.state || "",
    cep_destinatario: pedido.clients?.zip || "",
    
    // Itens da nota
    items: pedido.order_items.map((item: any, index: number) => ({
      numero_item: index + 1,
      codigo_produto: item.product_id,
      descricao: item.product_name,
      cfop: config.cfop_padrao,
      unidade_comercial: "UN",
      quantidade_comercial: item.quantity,
      valor_unitario_comercial: item.unit_price,
      valor_total_bruto: item.total_price,
      unidade_tributavel: "UN",
      quantidade_tributavel: item.quantity,
      valor_unitario_tributacao: item.unit_price,
      
      // Impostos
      icms_situacao_tributaria: config.csosn_padrao,
      icms_origem: 0,
      valor_total_tributos: 0
    }))
  };

  // Fazer chamada para API Focus NFe
  const baseUrl = config.ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${config.token_focus}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nfeData)
  });

  let responseData;
  try {
    const responseText = await response.text();
    console.log('Focus NFe Response Status:', response.status);
    console.log('Focus NFe Response Text:', responseText);
    
    if (!response.ok) {
      throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
    }
    
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error('Erro ao processar resposta da Focus NFe:', error);
    throw new Error(`Erro na comunicação com Focus NFe: ${error.message}`);
  }

  // Salvar nota emitida
  const { data: notaEmitida } = await supabase
    .from('notas_emitidas')
    .insert({
      user_id: userId,
      tipo_nota: config.tipo_nota,
      pedido_id: pedidoId,
      focus_id: responseData.ref || null,
      numero_nota: responseData.numero || null,
      chave_acesso: responseData.chave_nfe || null,
      status: responseData.status || 'processando',
      json_enviado: nfeData,
      json_resposta: responseData
    })
    .select()
    .single();

  // Registrar log
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaEmitida.id,
      acao: 'envio',
      status_code: response.status,
      mensagem: 'NFe enviada para Focus',
      resposta: responseData
    });

  return new Response(
    JSON.stringify({ success: true, nota: notaEmitida, focus_response: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function consultarStatus(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  // Buscar nota
  const { data: nota } = await supabase
    .from('notas_emitidas')
    .select('*, nota_configuracoes!inner(*)')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  const config = nota.nota_configuracoes;
  const baseUrl = config.ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}`, {
    headers: {
      'Authorization': `Token ${config.token_focus}`
    }
  });

  let responseData;
  try {
    const responseText = await response.text();
    console.log('Focus NFe Consulta Status:', response.status);
    console.log('Focus NFe Consulta Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
    }
    
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error('Erro ao consultar status na Focus NFe:', error);
    throw new Error(`Erro na comunicação com Focus NFe: ${error.message}`);
  }

  // Atualizar status da nota
  await supabase
    .from('notas_emitidas')
    .update({
      status: responseData.status,
      chave_acesso: responseData.chave_nfe || nota.chave_acesso,
      xml_url: responseData.caminho_xml_nota_fiscal || nota.xml_url,
      pdf_url: responseData.caminho_danfe || nota.pdf_url,
      json_resposta: responseData
    })
    .eq('id', notaId);

  // Registrar log
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaId,
      acao: 'consulta',
      status_code: response.status,
      mensagem: 'Status consultado',
      resposta: responseData
    });

  return new Response(
    JSON.stringify({ success: true, status: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function cancelarNFe(supabase: any, userId: string, payload: any) {
  const { notaId, motivo } = payload;

  // Buscar nota
  const { data: nota } = await supabase
    .from('notas_emitidas')
    .select('*, nota_configuracoes!inner(*)')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  const config = nota.nota_configuracoes;
  const baseUrl = config.ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}/cancelar`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${config.token_focus}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ justificativa: motivo })
  });

  let responseData;
  try {
    const responseText = await response.text();
    console.log('Focus NFe Cancelamento Status:', response.status);
    console.log('Focus NFe Cancelamento Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
    }
    
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error('Erro ao cancelar NFe na Focus NFe:', error);
    throw new Error(`Erro na comunicação com Focus NFe: ${error.message}`);
  }

  // Atualizar status da nota
  await supabase
    .from('notas_emitidas')
    .update({
      status: 'cancelado',
      json_resposta: responseData
    })
    .eq('id', notaId);

  // Registrar log
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaId,
      acao: 'cancelamento',
      status_code: response.status,
      mensagem: `NFe cancelada: ${motivo}`,
      resposta: responseData
    });

  return new Response(
    JSON.stringify({ success: true, response: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function obterPDF(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  // Buscar nota
  const { data: nota } = await supabase
    .from('notas_emitidas')
    .select('*, nota_configuracoes!inner(*)')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  const config = nota.nota_configuracoes;
  const baseUrl = config.ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}/danfe`, {
    headers: {
      'Authorization': `Token ${config.token_focus}`
    }
  });

  if (response.ok) {
    const pdfBuffer = await response.arrayBuffer();
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nfe-${nota.numero_nota}.pdf"`
      }
    });
  }

  return new Response(
    JSON.stringify({ error: 'PDF não disponível' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function obterXML(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  // Buscar nota
  const { data: nota } = await supabase
    .from('notas_emitidas')
    .select('*, nota_configuracoes!inner(*)')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  const config = nota.nota_configuracoes;
  const baseUrl = config.ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}/xml`, {
    headers: {
      'Authorization': `Token ${config.token_focus}`
    }
  });

  if (response.ok) {
    const xmlContent = await response.text();
    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe-${nota.numero_nota}.xml"`
      }
    });
  }

  return new Response(
    JSON.stringify({ error: 'XML não disponível' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}