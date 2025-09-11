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

// Função para validar CNPJ (14 dígitos sem máscara)
function validateCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  if (cleanCnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCnpj)) return false;

  let tamanho = cleanCnpj.length - 2;
  let numeros = cleanCnpj.substring(0, tamanho);
  let digitos = cleanCnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho += 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

async function emitirNFe(supabase: any, userId: string, payload: any) {
  const { pedidoId } = payload;

  // Buscar company_id do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  const companyId = userProfile?.company_id;

  // Buscar configurações Focus NFe, fiscais e dados da empresa filtrando por company_id
  const { data: allSettings } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .in('key', [
      'focus_nfe_token', 'focus_nfe_environment', 'focus_nfe_enabled',
      'tax_regime', 'default_cfop', 'default_ncm', 'icms_cst', 'icms_origem',
      'pis_cst', 'pis_aliquota', 'cofins_cst', 'cofins_aliquota',
      'company_name', 'company_cnpj', 'company_ie', 'company_city', 'company_state',
      'company_address', 'company_number', 'company_complement', 'company_neighborhood', 
      'company_cep', 'company_fantasy_name',
      'nota_fiscal_tipo', 'nota_fiscal_ambiente', 'empresa_tipo', 'csosn_padrao', 'cst_padrao',
      'icms_percentual', 'pis_percentual', 'cofins_percentual', 'cnpj_emissor'
    ])
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  console.log('Settings encontradas:', allSettings);
  
  // Criar mapa com valores mais recentes para cada chave
  const configMap = {} as Record<string, any>;
  const processedKeys = new Set<string>();
  
  allSettings?.forEach(setting => {
    if (!processedKeys.has(setting.key)) {
      try {
        configMap[setting.key] = JSON.parse(setting.value as string);
      } catch {
        configMap[setting.key] = setting.value;
      }
      processedKeys.add(setting.key);
    }
  });

  console.log('ConfigMap processado:', configMap);
  console.log('focus_nfe_enabled:', configMap.focus_nfe_enabled);
  console.log('focus_nfe_token:', configMap.focus_nfe_token ? `****...${configMap.focus_nfe_token.toString().slice(-4)}` : 'não configurado');

  // Validar configurações essenciais
  if (!configMap.focus_nfe_enabled) {
    return new Response(
      JSON.stringify({ success: false, error: 'Focus NFe não está habilitado nas configurações da empresa' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!configMap.focus_nfe_token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Token Focus NFe não configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Seleção inteligente do CNPJ: priorizar company_cnpj válido, fallback para cnpj_emissor
  let cnpjEmissor = '';
  let cnpjSource = '';
  
  // Priorizar company_cnpj se estiver disponível e válido (14 dígitos)
  if (configMap.company_cnpj) {
    const cleanCompanyCnpj = configMap.company_cnpj.replace(/[^\d]/g, '');
    if (cleanCompanyCnpj.length === 14 && validateCNPJ(cleanCompanyCnpj)) {
      cnpjEmissor = configMap.company_cnpj;
      cnpjSource = 'company_cnpj';
    }
  }
  
  // Fallback para cnpj_emissor apenas se company_cnpj não for válido
  if (!cnpjEmissor && configMap.cnpj_emissor) {
    const cleanEmissorCnpj = configMap.cnpj_emissor.replace(/[^\d]/g, '');
    if (cleanEmissorCnpj.length === 14 && validateCNPJ(cleanEmissorCnpj)) {
      cnpjEmissor = configMap.cnpj_emissor;
      cnpjSource = 'cnpj_emissor';
    }
  }
  
  console.log(`CNPJ selecionado da fonte: ${cnpjSource}, CNPJ: ****...${cnpjEmissor.toString().slice(-4)}`);
  
  if (!cnpjEmissor) {
    return new Response(
      JSON.stringify({ success: false, error: 'CNPJ da empresa emissora não configurado ou inválido. Verifique as configurações fiscais da empresa.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validar e sanitizar CNPJ selecionado (deve ter 14 dígitos)
  const cleanCnpj = cnpjEmissor.replace(/[^\d]/g, '');
  if (cleanCnpj.length !== 14) {
    return new Response(
      JSON.stringify({ success: false, error: `CNPJ do emitente inválido (precisa ter 14 dígitos). CNPJ atual: ${cnpjEmissor.replace(/\d(?=\d{4})/g, '*')}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!validateCNPJ(cleanCnpj)) {
    return new Response(
      JSON.stringify({ success: false, error: 'CNPJ do emitente inválido (falha na validação dos dígitos verificadores)' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = configMap.focus_nfe_token || "";
  if (!token) {
    throw new Error('Token Focus NFe não configurado');
  }

  console.log('Buscando pedido:', { pedidoId, userId });

  // Buscar dados do pedido, itens e cliente de forma resiliente (evita nested select vazio)
  const { data: pedidoBase, error: pedidoErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', pedidoId)
    .maybeSingle();

  if (pedidoErr || !pedidoBase) {
    throw new Error('Pedido não encontrado');
  }

  const { data: itensPedido, error: itemsErr } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', pedidoId);

  if (itemsErr) {
    throw new Error('Erro ao buscar itens do pedido');
  }

  if (!itensPedido || itensPedido.length === 0) {
    throw new Error('Pedido não encontrado ou sem itens');
  }

  const { data: clienteRow } = await supabase
    .from('clients')
    .select('*')
    .eq('id', pedidoBase.client_id)
    .maybeSingle();

  const pedido = { ...pedidoBase, order_items: itensPedido, clients: clienteRow } as any;

  // Buscar dados dos produtos para obter os códigos, pesos, unidades e informações fiscais
  const productIds = pedido.order_items.map((item: any) => item.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, code, sku, unit, weight, ncm, cest, cst_csosn, icms, pis, cofins')
    .in('id', productIds);

  const productCodeMap = products?.reduce((acc: any, product: any) => {
    acc[product.id] = product.code || product.id;
    return acc;
  }, {}) || {};

  const productWeightMap = products?.reduce((acc: any, product: any) => {
    acc[product.id] = Number(product.weight) || 0;
    return acc;
  }, {}) || {};
  
  const productMap = products?.reduce((acc: any, product: any) => {
    acc[product.id] = product;
    return acc;
  }, {}) || {};

  console.log('Resultado da busca:', { found: !!pedido, pedidoId });

  if (!pedido) {
    throw new Error('Pedido não encontrado');
  }

  // Verificar se o usuário tem permissão para emitir nota deste pedido
  // Admins podem emitir para qualquer pedido, vendedores só para os seus
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const { data: userPosition } = await supabase
    .from('user_positions')  
    .select('position')
    .eq('user_id', userId)
    .single();

  const isAdmin = userRole?.role === 'admin' || userRole?.role === 'master';
  const isSeller = userPosition?.position === 'vendedor';

  console.log('Verificação de permissões:', { 
    userId, 
    pedidoUserId: pedido.user_id, 
    userRole: userRole?.role, 
    userPosition: userPosition?.position,
    isAdmin, 
    isSeller 
  });

  // Se não é admin e é vendedor, só pode emitir nota dos próprios pedidos
  if (!isAdmin && isSeller && pedido.user_id !== userId) {
    throw new Error('Você não tem permissão para emitir nota fiscal deste pedido');
  }

  console.log('Pedido encontrado:', { id: pedido.id, client_name: pedido.client_name, items_count: pedido.order_items?.length });

  if (!pedido.order_items || pedido.order_items.length === 0) {
    throw new Error('Pedido sem itens');
  }

  // Detectar regime tributário e aplicar configurações específicas
  const taxRegime = Number(configMap.tax_regime || 3);
  const isSimplesToNacional = taxRegime === 1 || taxRegime === 2;
  
  // Configurações de impostos específicas por regime
  let pisAliquota: number, cofinsAliquota: number, pisCST: string, cofinsCST: string;
  let icmsConfig: any = {};
  
  if (isSimplesToNacional) {
    // Simples Nacional - usar CSOSN ao invés de CST
    pisAliquota = 0; // Simples Nacional não recolhe PIS/COFINS separadamente
    cofinsAliquota = 0;
    pisCST = "49"; // PIS não tributado pelo Simples Nacional
    cofinsCST = "49"; // COFINS não tributado pelo Simples Nacional
    
    icmsConfig = {
      situacao_tributaria: configMap.csosn_padrao || "101", // CSOSN para Simples Nacional
      origem: Number(configMap.icms_origem || 0),
      aliquota: 0, // Simples Nacional não destaca ICMS separadamente
      tipo_tributacao: "CSOSN"
    };
  } else {
    // Regime Normal - usar configurações manuais de impostos
    pisAliquota = Number(configMap.pis_percentual || configMap.pis_aliquota || 1.65);
    cofinsAliquota = Number(configMap.cofins_percentual || configMap.cofins_aliquota || 7.6);
    pisCST = configMap.pis_cst || "01";
    cofinsCST = configMap.cofins_cst || "01";
    
    const icmsAliquota = Number(configMap.icms_percentual || 18);
    icmsConfig = {
      situacao_tributaria: configMap.cst_padrao || configMap.icms_cst || "60",
      origem: Number(configMap.icms_origem || 0),
      aliquota: icmsAliquota,
      tipo_tributacao: "CST"
    };
  }
  
  // Outras configurações fiscais
  const defaultCfop = configMap.default_cfop || "5405";
  const defaultNcm = configMap.default_ncm || "19059090";
  
  // Dados da empresa do emissor (usar CNPJ limpo e validado)
  const companyCnpj = cleanCnpj; // Já validado acima
  const companyName = configMap.company_name || "ARTISAN BREAD PAES ARTESANAIS LTDA";
  const companyFantasyName = configMap.company_fantasy_name || "ARTISAN";
  const companyAddress = configMap.company_address || "V PASTOR MARTIN LUTHER KING JR.";
  const companyNumber = configMap.company_number || "11026";
  const companyComplement = configMap.company_complement || "LOJA A";
  const companyNeighborhood = configMap.company_neighborhood || "ACARI";
  const companyCity = configMap.company_city || "Rio de Janeiro";
  const companyState = configMap.company_state || "RJ";
  const companyCep = (configMap.company_cep || "21530014").replace(/[^\d]/g, '');
  const companyIe = configMap.company_ie || "11867847";
  
  console.log('Configurações fiscais aplicadas:', {
    taxRegime,
    isSimplesToNacional,
    pisAliquota,
    cofinsAliquota,
    pisCST,
    cofinsCST,
    icmsConfig
  });

  // Calcular valores totais usando configurações fiscais dinâmicas
  const valorTotalItens = pedido.order_items.reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
  const valorTotalPIS = valorTotalItens * (pisAliquota / 100);
  const valorTotalCOFINS = valorTotalItens * (cofinsAliquota / 100);
  
  // Calcular valores totais de ICMS se não for Simples Nacional
  let valorTotalICMSBase = 0;
  let valorTotalICMS = 0;
  
  if (!isSimplesToNacional && icmsConfig.aliquota > 0) {
    valorTotalICMSBase = valorTotalItens;
    valorTotalICMS = valorTotalItens * (icmsConfig.aliquota / 100);
  }
  
  const valorTotalTributos = valorTotalPIS + valorTotalCOFINS;

  // Montar JSON da NFe usando dados corretos da ARTISAN BREAD
  const nfeData = {
    natureza_operacao: "VENDA",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada_saida: new Date().toISOString().split('T')[0],
    tipo_documento: 1,
    finalidade_emissao: 1,
    
    // Dados da empresa emissora (dinâmicos das configurações)
    cnpj_emitente: companyCnpj,
    nome_emitente: companyName,
    nome_fantasia_emitente: companyFantasyName,
    logradouro_emitente: companyAddress,
    numero_emitente: companyNumber,
    complemento_emitente: companyComplement,
    bairro_emitente: companyNeighborhood,
    municipio_emitente: companyCity,
    uf_emitente: companyState,
    cep_emitente: companyCep,
    codigo_municipio_emitente: "3304557", // Rio de Janeiro (fixo por enquanto)
    inscricao_estadual_emitente: companyIe,
    regime_tributario_emitente: taxRegime,
    telefone_emitente: "2164335206", // Fixo por enquanto
    
    // Informações adicionais com número do pedido e forma de pagamento
    informacoes_adicionais: `Pedido: ${pedido.order_number || pedido.id}${pedido.payment_method ? ` | Forma de Pagamento: ${pedido.payment_method}` : ''}${pedido.payment_term ? ` | Prazo: ${pedido.payment_term}` : ''} | Data: ${new Date().toLocaleDateString('pt-BR')}`,
    
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
    icms_base_calculo: valorTotalICMSBase,
    icms_valor_total: valorTotalICMS,
    icms_base_calculo_st: 0,
    icms_valor_total_st: 0,
    
    // Totais IPI
    ipi_valor: 0,
    
    // Totais PIS/COFINS - removidos para não aparecer na DANFE
    // pis_valor: valorTotalPIS,
    // cofins_valor: valorTotalCOFINS,
    
    // Outras despesas
    valor_outras_despesas: 0,
    
    // Itens com campos conforme XML autorizado - usando dados fiscais específicos do produto
    items: pedido.order_items.map((item: any, index: number) => {
      const product = productMap[item.product_id];
      
      // Usar dados fiscais específicos do produto ou fallback para configurações gerais
      const productNcm = product?.ncm || defaultNcm;
      const productCest = product?.cest || "1706200";
      const productCstCsosn = product?.cst_csosn || (isSimplesToNacional ? icmsConfig.situacao_tributaria : icmsConfig.situacao_tributaria);
      const productIcmsAliquota = product?.icms ? parseFloat(product.icms) : icmsConfig.aliquota;
      const productPisAliquota = product?.pis ? parseFloat(product.pis) : pisAliquota;
      const productCofinsAliquota = product?.cofins ? parseFloat(product.cofins) : cofinsAliquota;

      return {
        numero_item: index + 1,
        codigo_produto: productCodeMap[item.product_id] || item.product_id,
        descricao: item.product_name,
        codigo_ncm: productNcm, // NCM específico do produto
        cest: productCest, // CEST específico do produto
        cfop: defaultCfop, // CFOP das configurações
        unidade_comercial: product?.unit || "UN", // Usar unidade do produto
        quantidade_comercial: Number(item.quantity),
        valor_unitario_comercial: Number(item.unit_price),
        valor_total_bruto: Number(item.total_price),
        unidade_tributavel: product?.unit || "UN", // Usar unidade do produto
        quantidade_tributavel: Number(item.quantity),
        valor_unitario_tributacao: Number(item.unit_price),
        codigo_ean: product?.sku || "SEM GTIN", // Usar SKU do produto ou SEM GTIN
        codigo_ean_tributavel: product?.sku || "SEM GTIN", // Usar SKU do produto ou SEM GTIN
        
        // Peso líquido (quantidade × peso do produto)
        peso_liquido: Number(item.quantity) * (productWeightMap[item.product_id] || 0),
        peso_bruto: Number(item.quantity) * (productWeightMap[item.product_id] || 0),
        
        // Impostos específicos do produto
        icms: {
          situacao_tributaria: productCstCsosn,
          origem: icmsConfig.origem,
          aliquota: productIcmsAliquota,
          valor_base_calculo: !isSimplesToNacional && productIcmsAliquota > 0 ? Number(item.total_price) : 0,
          valor: !isSimplesToNacional && productIcmsAliquota > 0 ? Number(item.total_price) * (productIcmsAliquota / 100) : 0
        },
        
        pis: {
          situacao_tributaria: pisCST,
          aliquota: productPisAliquota,
          valor_base_calculo: !isSimplesToNacional ? Number(item.total_price) : 0,
          valor: !isSimplesToNacional ? Number(item.total_price) * (productPisAliquota / 100) : 0
        },
        
        cofins: {
          situacao_tributaria: cofinsCST,
          aliquota: productCofinsAliquota,
          valor_base_calculo: !isSimplesToNacional ? Number(item.total_price) : 0,
          valor: !isSimplesToNacional ? Number(item.total_price) * (productCofinsAliquota / 100) : 0
        }
      };
    })
  };

  console.log('JSON NFe montado:', JSON.stringify(nfeData, null, 2));

  // Dados do ambiente Focus NFe
  const ambiente = configMap.nota_fiscal_ambiente || configMap.focus_nfe_environment || 'homologacao';
  const baseUrl = ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  // Fazer requisição para Focus NFe
  const focusId = `NFE${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('Enviando para Focus NFe:', {
    url: `${baseUrl}/v2/nfe?ref=${focusId}`,
    ambiente,
    token: `****...${token.slice(-4)}`
  });

  const response = await fetch(`${baseUrl}/v2/nfe?ref=${focusId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(token + ':')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nfeData)
  });

  let responseData;
  try {
    const responseText = await response.text();
    console.log('Focus NFe Status:', response.status);
    console.log('Focus NFe Response:', responseText);
    
    if (!response.ok) {
      // Para erros 4xx da Focus NFe, retornar erro amigável
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'CNPJ do emitente não autorizado no Focus NFe. Verifique: (1) CNPJ 14 dígitos, (2) emissor cadastrado e certificado A1 no painel da Focus, (3) token corresponde à conta do CNPJ, (4) ambiente correto (produção/homologação)';
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.codigo === 'permissao_negada' || errorData.mensagem?.includes('permissao_negada')) {
            errorMessage = `CNPJ ${companyCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')} não autorizado no Focus NFe. Verifique se: (1) CNPJ está correto, (2) emissor foi cadastrado no painel Focus NFe, (3) certificado A1 foi instalado, (4) token pertence a esta conta, (5) ambiente é o correto`;
          } else {
            errorMessage = errorData.mensagem || errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta de erro:', parseError);
        }
        
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
    }
    
    responseData = JSON.parse(responseText);
    
    // Verificar se houve erros de validação mesmo com status 200
    if (responseData.erros && responseData.erros.length > 0) {
      console.error('Erros de validação Focus NFe:', responseData.erros);
      
      // Compilar erros detalhados
      const errosDetalhados = responseData.erros.map((erro: any) => {
        if (typeof erro === 'string') return erro;
        return erro.mensagem || erro.codigo || JSON.stringify(erro);
      }).join(' | ');
      
      throw new Error(`Erro na validação do Schema XML: ${errosDetalhados}`);
    }
    
    // Verificar outros campos de erro possíveis
    if (responseData.status === 'erro' || responseData.erro) {
      const mensagemErro = responseData.mensagem || responseData.erro || 'Erro não especificado';
      console.error('Erro Focus NFe:', responseData);
      throw new Error(`Focus NFe: ${mensagemErro}`);
    }
    
    // Verificar se o status indica processamento com erro
    if (responseData.status_sefaz && responseData.status_sefaz !== 'autorizado') {
      console.error('Status SEFAZ não autorizado:', responseData);
      const motivoRejeicao = responseData.motivo_status || responseData.mensagem_sefaz || 'Motivo não informado';
      throw new Error(`NFe rejeitada pela SEFAZ: ${motivoRejeicao}`);
    }
    
  } catch (error) {
    console.error('Erro ao emitir NFe na Focus NFe:', error);
    throw new Error(error.message || `Erro na comunicação com Focus NFe: ${error.message}`);
  }

  // Salvar nota emitida no banco com company_id
  const { data: notaSalva } = await supabase
    .from('notas_emitidas')
    .insert({
      user_id: userId,
      order_id: pedidoId,
      focus_id: focusId,
      numero_nota: responseData.numero,
      serie_nota: responseData.serie,
      chave_acesso: responseData.chave_nfe,
      status: responseData.status,
      json_resposta: responseData,
      company_id: companyId
    })
    .select()
    .single();

  console.log('Nota salva no banco:', notaSalva);

  // Registrar log com company_id
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaSalva.id,
      acao: 'emissao',
      status_code: response.status,
      mensagem: 'NFe emitida com sucesso',
      resposta: responseData,
      company_id: companyId
    });

  return new Response(
    JSON.stringify({ success: true, nota: notaSalva, focus_response: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function consultarStatus(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  console.log('Consultando status para nota:', { notaId, userId });

  // Buscar company_id do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  const companyId = userProfile?.company_id;

  // Buscar nota
  const { data: nota, error: notaError } = await supabase
    .from('notas_emitidas')
    .select('*')
    .eq('id', notaId)
    .single();

  if (notaError) {
    console.error('Erro ao buscar nota:', notaError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar nota' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!nota) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nota não encontrada' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Buscar configurações Focus NFe filtrando por company_id
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'nota_fiscal_ambiente'])
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  // Criar mapa com valores mais recentes
  const configMap = {} as Record<string, any>;
  const processedKeys = new Set<string>();
  
  focusSettings?.forEach(setting => {
    if (!processedKeys.has(setting.key)) {
      try {
        configMap[setting.key] = JSON.parse(setting.value as string);
      } catch {
        configMap[setting.key] = setting.value;
      }
      processedKeys.add(setting.key);
    }
  });

  if (!configMap.focus_nfe_token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Token Focus NFe não configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ambiente = configMap.nota_fiscal_ambiente || configMap.focus_nfe_environment || 'homologacao';
  const baseUrl = ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  console.log('Consultando Focus NFe:', {
    focusId: nota.focus_id,
    ambiente,
    token: `****...${configMap.focus_nfe_token.toString().slice(-4)}`
  });

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
      // Para erros 4xx, retornar erro amigável
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'Erro ao consultar status da nota fiscal';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.mensagem || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta de erro:', parseError);
        }
        
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Focus NFe API Error (${response.status}): ${responseText}`);
    }
    
    responseData = JSON.parse(responseText);
  } catch (error) {
    console.error('Erro ao consultar status na Focus NFe:', error);
    throw new Error(`Erro na comunicação com Focus NFe: ${error.message}`);
  }

  // Atualizar dados da nota se houver alteração
  if (responseData && (responseData.status !== nota.status || responseData.numero !== nota.numero_nota)) {
    await supabase
      .from('notas_emitidas')
      .update({
        numero_nota: responseData.numero,
        serie_nota: responseData.serie,
        chave_acesso: responseData.chave_nfe,
        status: responseData.status,
        json_resposta: responseData
      })
      .eq('id', notaId);
  }

  // Registrar log com company_id
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaId,
      acao: 'consulta_status',
      status_code: response.status,
      mensagem: `Status consultado: ${responseData?.status}`,
      resposta: responseData,
      company_id: companyId
    });

  return new Response(
    JSON.stringify({ success: true, status: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function cancelarNFe(supabase: any, userId: string, payload: any) {
  const { notaId, motivo } = payload;

  // Buscar company_id do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  const companyId = userProfile?.company_id;

  // Buscar nota
  const { data: nota } = await supabase
    .from('notas_emitidas')
    .select('*')
    .eq('id', notaId)
    .eq('user_id', userId)
    .single();

  if (!nota) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nota não encontrada' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Buscar configurações Focus NFe filtrando por company_id
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'nota_fiscal_ambiente'])
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  // Criar mapa com valores mais recentes
  const configMap = {} as Record<string, any>;
  const processedKeys = new Set<string>();
  
  focusSettings?.forEach(setting => {
    if (!processedKeys.has(setting.key)) {
      try {
        configMap[setting.key] = JSON.parse(setting.value as string);
      } catch {
        configMap[setting.key] = setting.value;
      }
      processedKeys.add(setting.key);
    }
  });

  if (!configMap.focus_nfe_token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Token Focus NFe não configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ambiente = configMap.nota_fiscal_ambiente || configMap.focus_nfe_environment || 'homologacao';
  const baseUrl = ambiente === 'producao' 
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
      // Para erros 4xx, retornar erro amigável
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'Erro ao cancelar nota fiscal';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.mensagem || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta de erro:', parseError);
        }
        
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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

  // Registrar log com company_id
  await supabase
    .from('nota_logs')
    .insert({
      nota_id: notaId,
      acao: 'cancelamento',
      status_code: response.status,
      mensagem: `NFe cancelada: ${motivo}`,
      resposta: responseData,
      company_id: companyId
    });

  return new Response(
    JSON.stringify({ success: true, response: responseData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function obterPDF(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  console.log('Obtendo PDF para nota:', { notaId, userId });

  // Buscar company_id do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  const companyId = userProfile?.company_id;

  // Buscar nota
  const { data: nota, error: notaError } = await supabase
    .from('notas_emitidas')
    .select('*')
    .eq('id', notaId)
    .single();

  if (notaError) {
    console.error('Erro ao buscar nota:', notaError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar nota' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!nota) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nota não encontrada' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!nota.json_resposta?.caminho_danfe) {
    return new Response(
      JSON.stringify({ success: false, error: 'DANFE não disponível para esta nota' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Buscar configurações Focus NFe filtrando por company_id
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'nota_fiscal_ambiente'])
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  // Criar mapa com valores mais recentes
  const configMap = {} as Record<string, any>;
  const processedKeys = new Set<string>();
  
  focusSettings?.forEach(setting => {
    if (!processedKeys.has(setting.key)) {
      try {
        configMap[setting.key] = JSON.parse(setting.value as string);
      } catch {
        configMap[setting.key] = setting.value;
      }
      processedKeys.add(setting.key);
    }
  });

  if (!configMap.focus_nfe_token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Token Focus NFe não configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ambiente = configMap.nota_fiscal_ambiente || configMap.focus_nfe_environment || 'homologacao';
  const baseUrl = ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  // Formar URL completa usando o caminho retornado pela Focus NFe
  const danfeUrl = `${baseUrl}${nota.json_resposta.caminho_danfe}`;
  
  console.log('Fazendo requisição para Focus NFe:', { danfeUrl });

  const response = await fetch(danfeUrl, {
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`
    }
  });

  console.log('Resposta da Focus NFe:', { status: response.status, statusText: response.statusText });

  if (response.ok) {
    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF obtido com sucesso, tamanho:', pdfBuffer.byteLength);
    
    // Retornar o PDF diretamente como binary response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="danfe-${nota.numero_nota || nota.focus_id}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    });
  }

  const errorText = await response.text();
  console.error('Erro ao obter PDF:', { status: response.status, error: errorText });
  
  return new Response(
    JSON.stringify({ error: 'PDF não disponível', details: errorText }),
    { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function obterXML(supabase: any, userId: string, payload: any) {
  const { notaId } = payload;

  console.log('Obtendo XML para nota:', { notaId, userId });

  // Buscar company_id do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  const companyId = userProfile?.company_id;

  // Buscar nota
  const { data: nota, error: notaError } = await supabase
    .from('notas_emitidas')
    .select('*')
    .eq('id', notaId)
    .single();

  if (notaError) {
    console.error('Erro ao buscar nota:', notaError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar nota' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!nota) {
    return new Response(
      JSON.stringify({ success: false, error: 'Nota não encontrada' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!nota.json_resposta?.caminho_xml_nota_fiscal) {
    return new Response(
      JSON.stringify({ success: false, error: 'XML não disponível para esta nota' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Buscar configurações Focus NFe filtrando por company_id
  const { data: focusSettings } = await supabase
    .from('system_settings')
    .select('key, value, updated_at')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'nota_fiscal_ambiente'])
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  // Criar mapa com valores mais recentes
  const configMap = {} as Record<string, any>;
  const processedKeys = new Set<string>();
  
  focusSettings?.forEach(setting => {
    if (!processedKeys.has(setting.key)) {
      try {
        configMap[setting.key] = JSON.parse(setting.value as string);
      } catch {
        configMap[setting.key] = setting.value;
      }
      processedKeys.add(setting.key);
    }
  });

  if (!configMap.focus_nfe_token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Token Focus NFe não configurado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ambiente = configMap.nota_fiscal_ambiente || configMap.focus_nfe_environment || 'homologacao';
  const baseUrl = ambiente === 'producao' 
    ? 'https://api.focusnfe.com.br'
    : 'https://homologacao.focusnfe.com.br';

  // Formar URL completa usando o caminho retornado pela Focus NFe
  const xmlUrl = `${baseUrl}${nota.json_resposta.caminho_xml_nota_fiscal}`;
  
  console.log('Fazendo requisição para Focus NFe:', { xmlUrl });

  const response = await fetch(xmlUrl, {
    headers: {
      'Authorization': `Basic ${btoa(configMap.focus_nfe_token + ':')}`
    }
  });

  console.log('Resposta da Focus NFe:', { status: response.status, statusText: response.statusText });

  if (response.ok) {
    const xmlContent = await response.text();
    console.log('XML obtido com sucesso, tamanho:', xmlContent.length);
    
    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe-${nota.numero_nota || nota.focus_id}.xml"`
      }
    });
  }

  const errorText = await response.text();
  console.error('Erro ao obter XML:', { status: response.status, error: errorText });
  
  return new Response(
    JSON.stringify({ error: 'XML não disponível', details: errorText }),
    { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}