import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!authHeader) {
      throw new Error('Token de autorização obrigatório')
    }

    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

  const requestBody = await req.json()
  const { action, data } = requestBody || {}

  console.log('Focus NFe - Request body:', requestBody)
  console.log('Focus NFe - Action:', action, 'Data:', data)

  // Empresa do usuário (emissão por empresa)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Erro ao carregar perfil:', profileError)
    throw new Error('Não foi possível identificar a empresa do usuário')
  }
  const companyId = profile?.company_id || null;

  // Buscar configurações do Focus NFe (por empresa)
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('company_id', companyId)
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'focus_nfe_enabled', 'nota_fiscal_ambiente'])

  if (settingsError) {
    console.error('Erro ao buscar configurações:', settingsError)
    throw new Error('Erro ao buscar configurações: ' + settingsError.message)
  }

  console.log('Settings from database:', settings)

  // Função segura para fazer parsing JSON
  const safeJsonParse = (value: string) => {
    try {
      return JSON.parse(value)
    } catch (error) {
      console.log('Failed to parse as JSON, returning as string:', value)
      return value
    }
  }

  const normalize = (v: any) => (v === 'true' ? true : v === 'false' ? false : v)
  const configMap = settings.reduce((acc, setting) => {
    acc[setting.key] = normalize(safeJsonParse(setting.value as string))
    return acc
  }, {} as Record<string, any>)

  console.log('Config map:', configMap)

  // Para teste de conexão, não validar se está habilitado
  if (action !== 'test_connection') {
    if (!configMap.focus_nfe_enabled) {
      throw new Error('Integração com Focus NFe não está habilitada')
    }

    if (!configMap.focus_nfe_token) {
      throw new Error('Token Focus NFe não configurado')
    }
  }

    const environment = (configMap.focus_nfe_environment || configMap.nota_fiscal_ambiente || 'homologacao')
    const focusApiUrl = environment === 'producao' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br'

    if (action === 'test_connection') {
      console.log('=== TESTE DE CONEXÃO INICIADO ===')
      
      // Teste simples de conexão
      const testToken = (data && data.token) || configMap.focus_nfe_token
      const testEnvironment = (data && data.environment) || configMap.focus_nfe_environment || configMap.nota_fiscal_ambiente || 'homologacao'
      
      console.log('Token recebido (primeiros 10 caracteres):', testToken?.substring(0, 10))
      console.log('Ambiente:', testEnvironment)
      
      if (!testToken) {
        console.error('Token não fornecido')
        throw new Error('Token não fornecido')
      }

      const focusApiUrl = testEnvironment === 'producao' 
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br'

      console.log('URL da API Focus:', focusApiUrl)

      try {
        // Usar uma requisição simples para testar a conectividade e autenticação
        // Usar endpoint de consulta sem parâmetros específicos para verificar se o token é válido
        const focusResponse = await fetch(`${focusApiUrl}/v2/nfe/12345`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(testToken + ':'),
            'Content-Type': 'application/json'
          }
        })

        console.log('Status da resposta Focus:', focusResponse.status)
        console.log('Headers da resposta:', Object.fromEntries(focusResponse.headers.entries()))

        // Status 200 = sucesso
        if (focusResponse.ok) {
          const responseData = await focusResponse.text()
          console.log('Dados da resposta (sucesso):', responseData)
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Conexão estabelecida com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        // Status 404 = nota não encontrada (mas token é válido)
        else if (focusResponse.status === 404) {
          console.log('Erro 404 - Nota não encontrada (token válido)')
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Token válido - Conexão estabelecida com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        // Status 403 = token inválido
        else if (focusResponse.status === 403) {
          const errorData = await focusResponse.text()
          console.error('Erro 403 - Token inválido:', errorData)
          throw new Error('Token Focus NFe inválido ou não autorizado')
        }
        // Outros erros
        else {
          const errorData = await focusResponse.text()
          console.error('Erro da API Focus (status', focusResponse.status, '):', errorData)
          throw new Error(`Erro ${focusResponse.status}: ${errorData}`)
        }
      } catch (fetchError) {
        console.error('Erro na requisição para Focus NFe:', fetchError)
        throw new Error(`Erro na requisição: ${fetchError.message}`)
      }

    } else if (action === 'emit_nfe') {
      console.log('Emitindo NFe para:', data.sale_id)
      
      // Buscar dados da venda com JOIN manual para evitar problemas de nested selects
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', data.sale_id)
        .maybeSingle()

      if (saleError) {
        console.error('Erro ao buscar dados da venda:', saleError)
        throw new Error('Erro ao buscar dados da venda: ' + saleError.message)
      }

      if (!sale) {
        throw new Error('Venda não encontrada')
      }

      // Buscar dados do pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', sale.order_id)
        .maybeSingle()

      if (orderError || !order) {
        throw new Error('Pedido não encontrado')
      }

      // Buscar itens do pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(*)
        `)
        .eq('order_id', order.id)

      if (itemsError || !orderItems || orderItems.length === 0) {
        throw new Error('Itens do pedido não encontrados')
      }

      // Buscar dados do cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', sale.client_id)
        .maybeSingle()

      if (clientError || !client) {
        throw new Error('Cliente não encontrado')
      }

      console.log('Dados encontrados:')
      console.log('- Venda:', sale)
      console.log('- Pedido:', order)
      console.log('- Itens:', orderItems)
      console.log('- Cliente:', client)

      const { data: companySettings, error: companyError } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('company_id', companyId)
        .in('key', [
          'company_name','company_fantasy_name','company_cnpj','company_ie','company_cep',
          'company_address','company_number','company_complement','company_neighborhood',
          'company_city','company_state','company_phone',
          'tax_regime','default_cfop','default_ncm','icms_cst','icms_origem',
          'pis_cst','pis_aliquota','cofins_cst','cofins_aliquota',
          'csosn_padrao','cst_padrao','icms_percentual',
          'informar_valor_total_tributos','percentual_carga_tributaria'
        ])

      if (companyError) {
        throw new Error('Erro ao buscar dados da empresa: ' + companyError.message)
      }

      const companyData = companySettings.reduce((acc, setting) => {
        acc[setting.key] = safeJsonParse(setting.value as string)
        return acc
      }, {} as Record<string, any>)

      // Montar dados da NFe para Focus NFe usando dados reais da empresa (por empresa)
      const sanitizeDigits = (v: any) => (typeof v === 'string' ? v.replace(/[^\d]/g, '') : v)
      const isSN = ['1','2',1,2].includes((companyData.tax_regime ?? '').toString())
      const defaultCFOP = companyData.default_cfop || '5101'
      const defaultNCM = companyData.default_ncm || '19059090'
      const pisCst = companyData.pis_cst || (isSN ? '49' : '01')
      const cofinsCst = companyData.cofins_cst || (isSN ? '49' : '01')
      const pisAliq = parseFloat(companyData.pis_aliquota || (isSN ? '0' : '1.65'))
      const cofinsAliq = parseFloat(companyData.cofins_aliquota || (isSN ? '0' : '7.6'))
      const icmsOrigem = parseInt(companyData.icms_origem || '0')
      const icmsPercentual = parseFloat(companyData.icms_percentual || '0')
      const icmsCst = companyData.icms_cst || companyData.cst_padrao || '00'
      const icmsCsosn = companyData.csosn_padrao || '102'
      const informarVTotTrib = !!companyData.informar_valor_total_tributos
      const cargaTribPercent = parseFloat(companyData.percentual_carga_tributaria || '0')

      const nfeData = {
        natureza_operacao: 'VENDA',
        data_emissao: new Date().toISOString().split('T')[0],
        data_entrada_saida: new Date().toISOString().split('T')[0],
        tipo_documento: 1,
        finalidade_emissao: 1,
        local_destino: 1,
        consumidor_final: client.type === 'pf' || !client.ie ? 1 : 0,
        presenca_comprador: 1,

        // Emitente (da empresa atual)
        cnpj_emitente: sanitizeDigits(companyData.company_cnpj || companyData.cnpj_emissor || ''),
        nome_emitente: companyData.company_name,
        nome_fantasia_emitente: companyData.company_fantasy_name || companyData.company_name,
        logradouro_emitente: companyData.company_address,
        numero_emitente: companyData.company_number || 'S/N',
        complemento_emitente: companyData.company_complement || undefined,
        bairro_emitente: companyData.company_neighborhood,
        municipio_emitente: companyData.company_city,
        uf_emitente: companyData.company_state,
        cep_emitente: sanitizeDigits(companyData.company_cep),
        telefone_emitente: sanitizeDigits(companyData.company_phone || ''),
        inscricao_estadual_emitente: companyData.company_ie,
        regime_tributario_emitente: parseInt(companyData.tax_regime || '3'),

        // Destinatário
        cpf_destinatario: client.cpf ? sanitizeDigits(client.cpf) : undefined,
        cnpj_destinatario: client.cnpj ? sanitizeDigits(client.cnpj) : undefined,
        nome_destinatario: client.name,
        logradouro_destinatario: client.address,
        numero_destinatario: client.number || 'S/N',
        bairro_destinatario: client.bairro,
        municipio_destinatario: client.city,
        uf_destinatario: client.state,
        cep_destinatario: client.zip ? sanitizeDigits(client.zip) : undefined,
        indicador_ie_destinatario: client.ie ? 1 : (client.type === 'pf' ? 2 : 9),

        // Frete
        modalidade_frete: 3,

        // Itens da nota
        itens: orderItems.map((item: any, index: number) => {
          const valorTotal = Number(item.total_price) || 0
          const valorTributos = informarVTotTrib && cargaTribPercent > 0 ? (valorTotal * cargaTribPercent / 100) : 0
          const base = {
            numero_item: index + 1,
            codigo_produto: item.products?.code || item.product_id,
            codigo_ean: 'SEM GTIN',
            descricao: item.product_name,
            cfop: defaultCFOP,
            unidade_comercial: item.products?.unit || 'UN',
            quantidade_comercial: item.quantity,
            valor_unitario_comercial: item.unit_price,
            valor_total_bruto: valorTotal,
            codigo_ean_tributavel: 'SEM GTIN',
            unidade_tributavel: item.products?.unit || 'UN',
            quantidade_tributavel: item.quantity,
            valor_unitario_tributavel: item.unit_price,
            codigo_ncm: item.products?.ncm || defaultNCM,
            valor_total_tributos: valorTributos,
            inclui_no_total: 1
          } as any

          const icms = isSN
            ? { icms_origem: icmsOrigem, icms_csosn: icmsCsosn }
            : { icms_origem: icmsOrigem, icms_situacao_tributaria: icmsCst, ...(icmsPercentual > 0 ? { icms_aliquota_porcentual: icmsPercentual } : {}) }

          const pisCofins = {
            pis_situacao_tributaria: pisCst,
            ...(pisAliq > 0 ? { pis_aliquota_porcentual: pisAliq } : {}),
            cofins_situacao_tributaria: cofinsCst,
            ...(cofinsAliq > 0 ? { cofins_aliquota_porcentual: cofinsAliq } : {})
          }

          return { ...base, ...icms, ...pisCofins }
        }),

        // Totais e peso
        valor_produtos: sale.total_amount,
        valor_total: sale.total_amount,
        peso_liquido: orderItems.reduce((total: number, item: any) => {
          const weight = item.products?.weight || 1
          return total + (weight * item.quantity)
        }, 0),

        // Informações complementares
        informacoes_adicionais_contribuinte: [
          `VENDA ${sale.sale_number} - PEDIDO ${order.order_number}`,
          informarVTotTrib && cargaTribPercent > 0 ? `VALOR APROXIMADO DOS TRIBUTOS: ${(Number(sale.total_amount) * cargaTribPercent / 100).toFixed(2)} (${cargaTribPercent}%)` : '',
          data.observations || ''
        ].filter((info) => (info || '').toString().trim() !== '').join(' - ')
      }

      console.log('NFe Data montada:', JSON.stringify(nfeData, null, 2))
      console.log('Focus API URL:', focusApiUrl)
      console.log('Token para Focus (primeiros 10 chars):', configMap.focus_nfe_token?.substring(0, 10))

      // Enviar para Focus NFe
      console.log('Enviando para Focus NFe...')
      
      try {
        const focusResponse = await fetch(`${focusApiUrl}/v2/nfe?ref=${sale.sale_number}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(configMap.focus_nfe_token + ':')
          },
          body: JSON.stringify(nfeData)
        })

        console.log('Focus Response Status:', focusResponse.status)
        console.log('Focus Response Headers:', Object.fromEntries(focusResponse.headers.entries()))
        
        let focusResult
        try {
          focusResult = await focusResponse.json()
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta do Focus:', parseError)
          const responseText = await focusResponse.text()
          console.error('Resposta raw do Focus:', responseText)
          throw new Error(`Erro na resposta do Focus NFe: ${responseText}`)
        }

        console.log('Focus Result:', focusResult)

        if (!focusResponse.ok) {
          console.error('Erro Focus NFe (status não OK):', focusResult)
          throw new Error(focusResult.erro_principal || focusResult.mensagem || 'Erro ao comunicar com Focus NFe')
        }
      } catch (fetchError) {
        console.error('Erro na requisição para Focus NFe:', fetchError)
        throw new Error(`Erro de conexão com Focus NFe: ${fetchError.message}`)
      }

      // Salvar NFe na tabela fiscal_invoices
      const { data: fiscalInvoice, error: invoiceError } = await supabase
        .from('fiscal_invoices')
        .insert({
          user_id: user.id,
          sale_id: data.sale_id,
          order_id: sale.order_id,
          client_id: sale.client_id,
          invoice_number: data.invoice_number,
          invoice_type: 'NFe',
          status: focusResult.status === 'erro' ? 'rejected' : 'pending',
          total_amount: sale.total_amount,
          focus_reference: sale.sale_number,
          focus_status: focusResult.status,
          focus_message: focusResult.mensagem_sefaz || focusResult.erro_principal,
          focus_response: focusResult,
          observations: data.observations,
          error_message: focusResult.erro_principal
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Erro ao salvar NFe:', invoiceError)
      }

      // Atualizar venda com dados da NFe
      const { data: saleData } = await supabase
        .from('sales')
        .update({
          status: 'invoiced',
          invoice_number: data.invoice_number,
          invoice_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', data.sale_id)
        .select('order_id')
        .single()

      // Atualizar pedido relacionado com status faturado
      if (saleData?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'invoiced'
          })
          .eq('id', saleData.order_id)
      }

      console.log('NFe emitida com sucesso:', focusResult)

      return new Response(JSON.stringify({
        success: true,
        message: 'NFe enviada para processamento',
        focus_result: focusResult,
        fiscal_invoice: fiscalInvoice
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'check_nfe_status') {
      // Consultar status da NFe
      const focusResponse = await fetch(`${focusApiUrl}/v2/nfe/${data.reference}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(configMap.focus_nfe_token + ':')
        }
      })

      const focusResult = await focusResponse.json()
      
      // Atualizar status na tabela fiscal_invoices se fornecido
      if (data.fiscal_invoice_id) {
        await supabase
          .from('fiscal_invoices')
          .update({
            status: focusResult.status === 'autorizado' ? 'authorized' : 
                   focusResult.status === 'rejeitado' ? 'rejected' : 'pending',
            focus_status: focusResult.status,
            focus_message: focusResult.mensagem_sefaz,
            invoice_key: focusResult.chave_nfe,
            protocol_number: focusResult.numero_protocolo,
            authorization_date: focusResult.status === 'autorizado' ? new Date().toISOString() : null,
            focus_response: focusResult
          })
          .eq('id', data.fiscal_invoice_id)
      }

      return new Response(JSON.stringify({
        success: true,
        status: focusResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'get_danfe_pdf') {
      // Baixar DANFE em PDF
      console.log('Baixando DANFE para referência:', data.reference)
      
      // Primeiro, verificar se a NFe existe e está autorizada
      const statusResponse = await fetch(`${focusApiUrl}/v2/nfe/${data.reference}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(configMap.focus_nfe_token + ':')
        }
      })

      console.log('Status da consulta NFe:', statusResponse.status)

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error('Erro ao consultar NFe:', errorText)
        throw new Error(`NFe não encontrada ou erro na consulta: ${errorText}`)
      }

      const nfeData = await statusResponse.json()
      console.log('Dados da NFe:', nfeData)

      // Verificar se a NFe está autorizada
      if (nfeData.status !== 'autorizado') {
        throw new Error(`NFe não está autorizada. Status atual: ${nfeData.status}`)
      }

      // Se a NFe tem uma URL do DANFE, usar essa URL
      if (nfeData.danfe_pdf) {
        console.log('Usando URL do DANFE da NFe:', nfeData.danfe_pdf)
        const danfeResponse = await fetch(nfeData.danfe_pdf)
        
        if (!danfeResponse.ok) {
          throw new Error('Erro ao baixar DANFE da URL fornecida')
        }

        const pdfBuffer = await danfeResponse.arrayBuffer()
        const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))
        
        return new Response(JSON.stringify({
          success: true,
          fileData: base64Pdf,
          fileName: `DANFE-${data.reference}.pdf`,
          contentType: 'application/pdf'
        }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        })
      }

      // Caso não tenha URL, tentar gerar o DANFE
      throw new Error('DANFE não disponível para download. A NFe pode não estar processada completamente.')

    } else if (action === 'get_xml') {
      // Baixar XML da NFe
      console.log('Baixando XML para referência:', data.reference)
      
      // Primeiro, verificar se a NFe existe e está autorizada
      const statusResponse = await fetch(`${focusApiUrl}/v2/nfe/${data.reference}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(configMap.focus_nfe_token + ':')
        }
      })

      console.log('Status da consulta NFe para XML:', statusResponse.status)

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error('Erro ao consultar NFe:', errorText)
        throw new Error(`NFe não encontrada ou erro na consulta: ${errorText}`)
      }

      const nfeData = await statusResponse.json()
      console.log('Dados da NFe para XML:', nfeData)

      // Verificar se a NFe está autorizada
      if (nfeData.status !== 'autorizado') {
        throw new Error(`NFe não está autorizada. Status atual: ${nfeData.status}`)
      }

      // Se a NFe tem uma URL do XML, usar essa URL
      if (nfeData.caminho_xml_nota_fiscal) {
        console.log('Usando URL do XML da NFe:', nfeData.caminho_xml_nota_fiscal)
        const xmlResponse = await fetch(nfeData.caminho_xml_nota_fiscal)
        
        if (!xmlResponse.ok) {
          throw new Error('Erro ao baixar XML da URL fornecida')
        }

        const xmlContent = await xmlResponse.text()
        
        // Validar se é um XML válido
        if (!xmlContent.includes('<?xml') || !xmlContent.includes('<NFe')) {
          console.error('XML inválido recebido:', xmlContent.substring(0, 200))
          throw new Error('XML recebido está inválido')
        }
        
        return new Response(JSON.stringify({
          success: true,
          fileData: xmlContent,
          fileName: `NFe-${data.reference}.xml`,
          contentType: 'application/xml'
        }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          }
        })
      }

      // Caso não tenha URL, tentar o endpoint direto
      throw new Error('XML não disponível para download. A NFe pode não estar processada completamente.')

    } else if (action === 'list_invoices') {
      // Listar NFes do usuário
      const { data: invoices, error } = await supabase
        .from('fiscal_invoices')
        .select(`
          *,
          sales(sale_number, client_name),
          orders(order_number),
          clients(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao listar NFes: ' + error.message)
      }

      return new Response(JSON.stringify({
        success: true,
        invoices: invoices
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      throw new Error('Ação não reconhecida')
    }

  } catch (error) {
    console.error('Erro na function focus-nfe-emission:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 200, // Retornar status 200 para evitar erro de "non-2xx status code"
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})