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

  // Montar JSON da NFe conforme documentação oficial Focus NFe
  const nfeData = {
    natureza_operacao: "Venda",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada_saida: new Date().toISOString().split('T')[0],
    tipo_documento: 1,
    finalidade_emissao: 1,
    
    // Dados completos do emitente (obrigatórios conforme doc)
    cnpj_emitente: config.cnpj_emissor.replace(/[^\d]/g, ''),
    nome_emitente: "Empresa Teste LTDA",
    nome_fantasia_emitente: "Empresa Teste",
    logradouro_emitente: "Rua Padre Natal Pigato",
    numero_emitente: "100",
    bairro_emitente: "Santa Felicidade",
    municipio_emitente: "São Paulo",
    uf_emitente: "SP",
    cep_emitente: "01234567",
    codigo_municipio_emitente: "3550308",
    inscricao_estadual_emitente: "123456789",
    regime_tributario_emitente: Number(config.regime_tributario) || 3,
    
    // Dados do destinatário
    nome_destinatario: pedido.clients?.name || pedido.client_name || "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL",
    logradouro_destinatario: pedido.clients?.address || "Rua São Januário",
    numero_destinatario: pedido.clients?.number || "99",
    bairro_destinatario: pedido.clients?.bairro || "Crespo",
    municipio_destinatario: pedido.clients?.city || "Manaus",
    uf_destinatario: pedido.clients?.state || "AM",
    cep_destinatario: (pedido.clients?.zip || "69073178").replace(/[^\d]/g, ''),
    codigo_municipio_destinatario: "3550308",
    pais_destinatario: "Brasil",
    
    // Valores totais calculados
    valor_produtos: valorTotalItens,
    valor_total: valorTotalItens,
    valor_tributos_totais: valorTotalTributos,
    valor_frete: 0,
    valor_seguro: 0,
    valor_desconto: 0,
    modalidade_frete: 9, // Sem frete
    
    // Totais ICMS
    icms_base_calculo: 0,
    icms_valor_total: 0,
    icms_base_calculo_st: 0,
    icms_valor_total_st: 0,
    
    // Totais IPI
    ipi_valor: 0,
    
    // Totais PIS/COFINS
    pis_valor: valorTotalPIS,
    cofins_valor: valorTotalCOFINS,
    
    // Outras despesas
    valor_outras_despesas: 0,
    
    // Itens com campos obrigatórios conforme documentação
    items: pedido.order_items.map((item: any, index: number) => ({
      numero_item: index + 1,
      codigo_produto: item.product_id,
      descricao: item.product_name,
      cfop: config.cfop_padrao || "5102",
      unidade_comercial: "UN",
      quantidade_comercial: Number(item.quantity),
      valor_unitario_comercial: Number(item.unit_price),
      valor_total_bruto: Number(item.total_price),
      unidade_tributavel: "UN",
      quantidade_tributavel: Number(item.quantity),
      valor_unitario_tributacao: Number(item.unit_price),
      codigo_ncm: "49111090", // NCM genérico - deveria vir do cadastro do produto
      
      // ICMS completo
      icms_situacao_tributaria: config.csosn_padrao || "101",
      icms_origem: 0,
      icms_base_calculo: 0,
      icms_valor: 0,
      icms_aliquota_porcentual: 0,
      
      // IPI
      ipi_situacao_tributaria: "53", // Saída não tributada
      ipi_valor: 0,
      
      // PIS completo
      pis_situacao_tributaria: "01",
      pis_aliquota_porcentual: Number(config.pis_percentual) || 1.65,
      pis_valor: Number(item.total_price) * (Number(config.pis_percentual || 1.65) / 100),
      pis_base_calculo: Number(item.total_price),
      
      // COFINS completo
      cofins_situacao_tributaria: "01",
      cofins_aliquota_porcentual: Number(config.cofins_percentual) || 7.6,
      cofins_valor: Number(item.total_price) * (Number(config.cofins_percentual || 7.6) / 100),
      cofins_base_calculo: Number(item.total_price),
      
      // Valor total de tributos do item
      valor_total_tributos: Number(item.total_price) * 0.2736, // PIS + COFINS + estimativa outros
      
      // Inclui no total da nota
      inclui_no_total: 1
    }))
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

  // Usar referência única para a NFe
  const referencia = `nfe_${pedidoId}_${Date.now()}`;
  
  const response = await fetch(`${baseUrl}/v2/nfe?ref=${referencia}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(config.token_focus + ':')}`,
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
      'Authorization': `Basic ${btoa(config.token_focus + ':')}`
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

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(config.token_focus + ':')}`,
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
      'Authorization': `Basic ${btoa(config.token_focus + ':')}`
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
      'Authorization': `Basic ${btoa(config.token_focus + ':')}`
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