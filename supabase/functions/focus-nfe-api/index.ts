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

  // Buscar configurações Focus NFe e fiscais do sistema
  const { data: allSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', [
      'focus_nfe_token', 'focus_nfe_environment', 'focus_nfe_enabled',
      'tax_regime', 'default_cfop', 'default_ncm', 'icms_cst', 'icms_origem',
      'pis_cst', 'pis_aliquota', 'cofins_cst', 'cofins_aliquota'
    ]);

  const configMap = allSettings?.reduce((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value as string);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  if (!configMap.focus_nfe_enabled) {
    throw new Error('Emissão via Focus NFe não está habilitada');
  }

  if (!configMap.focus_nfe_token) {
    throw new Error('Token Focus NFe não configurado');
  }

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

  if (!pedido.order_items || pedido.order_items.length === 0) {
    throw new Error('Pedido sem itens');
  }

  // Usar configurações fiscais dinâmicas
  const pisAliquota = Number(configMap.pis_aliquota || 1.65);
  const cofinsAliquota = Number(configMap.cofins_aliquota || 7.6);
  const defaultCfop = configMap.default_cfop || "5405";
  const defaultNcm = configMap.default_ncm || "19059090";
  const icmsCst = configMap.icms_cst || "60";
  const icmsOrigem = Number(configMap.icms_origem || 0);

  // Calcular valores totais usando configurações fiscais dinâmicas
  const valorTotalItens = pedido.order_items.reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
  const valorTotalPIS = valorTotalItens * (pisAliquota / 100);
  const valorTotalCOFINS = valorTotalItens * (cofinsAliquota / 100);
  const valorTotalTributos = valorTotalPIS + valorTotalCOFINS;

  // Montar JSON da NFe usando dados corretos da ARTISAN BREAD
  const nfeData = {
    natureza_operacao: "VENDA",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada_saida: new Date().toISOString().split('T')[0],
    tipo_documento: 1,
    finalidade_emissao: 1,
    
    // Dados corretos da ARTISAN BREAD conforme XML autorizado
    cnpj_emitente: "39524018000128",
    nome_emitente: "ARTISAN BREAD PAES ARTESANAIS LTDA",
    nome_fantasia_emitente: "ARTISAN",
    logradouro_emitente: "V PASTOR MARTIN LUTHER KING JR.",
    numero_emitente: "11026",
    complemento_emitente: "LOJA A",
    bairro_emitente: "ACARI",
    municipio_emitente: "Rio de Janeiro",
    uf_emitente: "RJ",
    cep_emitente: "21530014",
    codigo_municipio_emitente: "3304557",
    inscricao_estadual_emitente: "11867847",
    regime_tributario_emitente: 3, // Regime Normal
    telefone_emitente: "2164335206",
    
    // Dados do destinatário (cliente)
    nome_destinatario: pedido.clients?.name || pedido.client_name || "CONSUMIDOR FINAL",
    logradouro_destinatario: pedido.clients?.address || "Não informado",
    numero_destinatario: pedido.clients?.number || "S/N",
    bairro_destinatario: pedido.clients?.bairro || "Não informado",
    municipio_destinatario: pedido.clients?.city || "Rio de Janeiro",
    uf_destinatario: pedido.clients?.state || "RJ",
    cep_destinatario: (pedido.clients?.zip || "20000000").replace(/[^\d]/g, ''),
    codigo_municipio_destinatario: "3304557", // Rio de Janeiro
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
    
    // Itens com campos conforme XML autorizado
    items: pedido.order_items.map((item: any, index: number) => ({
      numero_item: index + 1,
      codigo_produto: item.product_id,
      descricao: item.product_name,
      codigo_ncm: defaultNcm, // NCM das configurações
      cest: "1706200", // CEST conforme XML autorizado
      cfop: defaultCfop, // CFOP das configurações
      unidade_comercial: "CX", // Conforme XML
      quantidade_comercial: Number(item.quantity),
      valor_unitario_comercial: Number(item.unit_price),
      valor_total_bruto: Number(item.total_price),
      unidade_tributavel: "CX", // Conforme XML
      quantidade_tributavel: Number(item.quantity),
      valor_unitario_tributacao: Number(item.unit_price),
      codigo_ean: "SEM GTIN", // Conforme XML
      codigo_ean_tributavel: "SEM GTIN", // Conforme XML
      
      // ICMS - Substituição Tributária conforme configurações
      icms_situacao_tributaria: icmsCst,
      icms_origem: icmsOrigem,
      
      // PIS conforme configurações fiscais
      pis_situacao_tributaria: "01",
      pis_aliquota_porcentual: pisAliquota,
      pis_valor: Number(item.total_price) * (pisAliquota / 100),
      pis_base_calculo: Number(item.total_price),
      
      // COFINS conforme configurações fiscais
      cofins_situacao_tributaria: "01",
      cofins_aliquota_porcentual: cofinsAliquota,
      cofins_valor: Number(item.total_price) * (cofinsAliquota / 100),
      cofins_base_calculo: Number(item.total_price),
      
      // Valor total de tributos do item
      valor_total_tributos: Number(item.total_price) * ((pisAliquota + cofinsAliquota) / 100),
      
      // Inclui no total da nota
      inclui_no_total: 1
    }))
  };

  // Adicionar CPF ou CNPJ do destinatário e campos específicos conforme XML
  if (pedido.clients?.cnpj) {
    nfeData['cnpj_destinatario'] = pedido.clients.cnpj.replace(/[^\d]/g, '');
    nfeData['indicador_ie_destinatario'] = 1; // Contribuinte do ICMS
    nfeData['inscricao_estadual_destinatario'] = pedido.clients?.ie || '';
  } else if (pedido.clients?.cpf) {
    nfeData['cpf_destinatario'] = pedido.clients.cpf.replace(/[^\d]/g, '');
    nfeData['indicador_ie_destinatario'] = 9; // Não contribuinte
  }
  
  // Ajustar modalidade de frete conforme XML autorizado (3 = por conta do destinatário)
  nfeData.modalidade_frete = 3;

  console.log('NFe Data montada:', JSON.stringify(nfeData, null, 2));

  // Usar ambiente configurado
  const baseUrl = configMap.focus_nfe_environment === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';
  
  // Usar referência única para a NFe
  const referencia = `nfe_${pedidoId}_${Date.now()}`;
  
  const response = await fetch(`${baseUrl}/v2/nfe?ref=${referencia}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`,
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
      tipo_nota: 'nfe',
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
    .select('*')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  // Buscar configurações Focus NFe
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment']);

  const configMap = focusSettings?.reduce((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value as string);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const baseUrl = configMap.focus_nfe_environment === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}`, {
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`
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
    .select('*')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  // Buscar configurações Focus NFe
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment']);

  const configMap = focusSettings?.reduce((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value as string);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const baseUrl = configMap.focus_nfe_environment === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`,
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
    .select('*')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  // Buscar configurações Focus NFe
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment']);

  const configMap = focusSettings?.reduce((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value as string);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const baseUrl = configMap.focus_nfe_environment === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}/danfe`, {
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`
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
    .select('*')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    throw new Error('Nota não encontrada');
  }

  // Buscar configurações Focus NFe
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment']);

  const configMap = focusSettings?.reduce((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value as string);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const baseUrl = configMap.focus_nfe_environment === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  const response = await fetch(`${baseUrl}/v2/nfe/${nota.focus_id}/xml`, {
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`
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