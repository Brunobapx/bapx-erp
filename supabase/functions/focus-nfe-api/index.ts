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

  console.log('Config encontrada:', config);

  // Buscar dados do pedido com JOIN correto
  const { data: pedido } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*),
      clients!orders_client_id_fkey(*)
    `)
    .eq('id', pedidoId)
    .eq('user_id', userId)
    .single();

  if (!pedido) {
    throw new Error('Pedido não encontrado ou não pertence ao usuário');
  }

  console.log('Pedido encontrado:', { id: pedido.id, client_name: pedido.client_name, items_count: pedido.order_items?.length });

  // Validar dados obrigatórios
  if (!config.cnpj_emissor) {
    throw new Error('CNPJ do emissor não configurado');
  }

  if (!config.token_focus) {
    throw new Error('Token Focus NFe não configurado');
  }

  if (!pedido.order_items || pedido.order_items.length === 0) {
    throw new Error('Pedido sem itens');
  }

  // Calcular valores totais
  const valorTotalItens = pedido.order_items.reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
  const valorTotalICMS = valorTotalItens * (Number(config.icms_percentual) / 100);
  const valorTotalPIS = valorTotalItens * (Number(config.pis_percentual) / 100);
  const valorTotalCOFINS = valorTotalItens * (Number(config.cofins_percentual) / 100);
  const valorTotalTributos = valorTotalICMS + valorTotalPIS + valorTotalCOFINS;

  // Montar JSON da NFe conforme documentação Focus NFe
  const nfeData = {
    natureza_operacao: "Venda",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada_saida: new Date().toISOString().split('T')[0],
    tipo_documento: 1, // Saída
    finalidade_emissao: 1, // Normal
    
    // Dados do emitente (obrigatórios)
    cnpj_emitente: config.cnpj_emissor.replace(/[^\d]/g, ''),
    nome_emitente: "Empresa Teste LTDA",
    logradouro_emitente: "Rua Teste",
    numero_emitente: "123",
    bairro_emitente: "Centro",
    municipio_emitente: "São Paulo",
    uf_emitente: "SP",
    cep_emitente: "01234567",
    codigo_municipio_emitente: "3550308", // Código IBGE de São Paulo
    inscricao_estadual_emitente: "123456789",
    regime_tributario_emitente: Number(config.regime_tributario) || 1,
    
    // Dados do destinatário
    nome_destinatario: pedido.clients?.name || pedido.client_name || "Cliente Teste",
    logradouro_destinatario: pedido.clients?.address || "Rua do Cliente",
    numero_destinatario: pedido.clients?.number || "S/N",
    bairro_destinatario: pedido.clients?.bairro || "Centro",
    municipio_destinatario: pedido.clients?.city || "São Paulo",
    uf_destinatario: pedido.clients?.state || "SP",
    cep_destinatario: (pedido.clients?.zip || "01234567").replace(/[^\d]/g, ''),
    codigo_municipio_destinatario: "3550308",
    
    // Valores totais
    valor_produtos: valorTotalItens,
    valor_total: valorTotalItens,
    valor_tributos_totais: valorTotalTributos,
    
    // Itens da nota
    items: pedido.order_items.map((item: any, index: number) => {
      const valorTributoItem = Number(item.total_price) * 0.2; // 20% de exemplo
      
      return {
        numero_item: index + 1,
        codigo_produto: item.product_id.substring(0, 60), // Máximo 60 caracteres
        descricao: item.product_name.substring(0, 120), // Máximo 120 caracteres
        cfop: config.cfop_padrao || "5102",
        unidade_comercial: "UN",
        quantidade_comercial: Number(item.quantity),
        valor_unitario_comercial: Number(item.unit_price),
        valor_total_bruto: Number(item.total_price),
        unidade_tributavel: "UN",
        quantidade_tributavel: Number(item.quantity),
        valor_unitario_tributacao: Number(item.unit_price),
        
        // ICMS
        icms_situacao_tributaria: config.csosn_padrao || "102",
        icms_origem: 0,
        
        // PIS
        pis_situacao_tributaria: "01",
        pis_aliquota_porcentual: Number(config.pis_percentual) || 1.65,
        pis_valor: Number(item.total_price) * (Number(config.pis_percentual) / 100),
        
        // COFINS
        cofins_situacao_tributaria: "01", 
        cofins_aliquota_porcentual: Number(config.cofins_percentual) || 7.6,
        cofins_valor: Number(item.total_price) * (Number(config.cofins_percentual) / 100),
        
        valor_total_tributos: valorTributoItem
      };
    })
  };

  // Adicionar CPF ou CNPJ do destinatário se disponível
  if (pedido.clients?.cnpj) {
    nfeData['cnpj_destinatario'] = pedido.clients.cnpj.replace(/[^\d]/g, '');
  } else if (pedido.clients?.cpf) {
    nfeData['cpf_destinatario'] = pedido.clients.cpf.replace(/[^\d]/g, '');
  }

  console.log('NFe Data montada:', JSON.stringify(nfeData, null, 2));

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

  const responseText = await response.text();
  console.log('Focus NFe Response Status:', response.status);
  console.log('Focus NFe Response Text:', responseText);
  
  if (!response.ok) {
    throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
  }
  
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Erro ao fazer parse do JSON da Focus NFe:', parseError);
    throw new Error(`Resposta inválida da Focus NFe: ${responseText}`);
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