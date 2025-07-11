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

  // Buscar configurações do Focus NFe
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['focus_nfe_token', 'focus_nfe_environment', 'focus_nfe_enabled'])

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

  const configMap = settings.reduce((acc, setting) => {
    acc[setting.key] = safeJsonParse(setting.value as string)
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

    const focusApiUrl = configMap.focus_nfe_environment === 'producao' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br'

    if (action === 'test_connection') {
      console.log('=== TESTE DE CONEXÃO INICIADO ===')
      
      // Teste simples de conexão
      const testToken = (data && data.token) || configMap.focus_nfe_token
      const testEnvironment = (data && data.environment) || configMap.focus_nfe_environment
      
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

      // Buscar configurações da empresa
      const { data: companySettings, error: companyError } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'company_name', 'company_cnpj', 'company_ie', 'company_cep', 
          'company_street', 'company_number', 'company_neighborhood', 
          'company_city', 'company_state', 'company_phone'
        ])

      if (companyError) {
        throw new Error('Erro ao buscar dados da empresa: ' + companyError.message)
      }

      const companyData = companySettings.reduce((acc, setting) => {
        acc[setting.key] = safeJsonParse(setting.value as string)
        return acc
      }, {} as Record<string, any>)

      // Montar dados da NFe para Focus NFe usando dados reais da empresa
      const nfeData = {
        natureza_operacao: "VENDA",
        data_emissao: new Date().toISOString().split('T')[0],
        data_entrada_saida: new Date().toISOString().split('T')[0],
        tipo_documento: 1, // Saída
        finalidade_emissao: 1, // Normal
        local_destino: 1, // Operação interna (mesmo estado)
        consumidor_final: client.type === 'pf' || !client.ie ? 1 : 0, // 1=PF ou PJ sem IE (consumidor final), 0=PJ com IE (não consumidor final)
        presenca_comprador: 1, // Operação presencial
        
        // Dados do emitente (ARTISAN BREAD)
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
        telefone_emitente: "21643352067",
        inscricao_estadual_emitente: "11867847",
        regime_tributario_emitente: 3, // Regime Normal (baseado no porte da empresa)
        
        // Dados do destinatário
        cpf_destinatario: client.cpf?.replace(/[^\d]/g, ''),
        cnpj_destinatario: client.cnpj?.replace(/[^\d]/g, ''),
        nome_destinatario: client.name,
        logradouro_destinatario: client.address,
        numero_destinatario: client.number || "S/N",
        bairro_destinatario: client.bairro,
        municipio_destinatario: client.city,
        uf_destinatario: client.state,
        cep_destinatario: client.zip?.replace(/[^\d]/g, ''),
        indicador_ie_destinatario: client.ie ? 1 : (client.type === 'pf' ? 2 : 9), // 1=Contribuinte, 2=Isento, 9=Não contribuinte
        
        // Modalidade de frete
        modalidade_frete: 3, // Por conta do destinatário

        // Itens da nota
        itens: orderItems.map((item: any, index: number) => ({
          numero_item: index + 1,
          codigo_produto: item.products?.code || item.product_id,
          codigo_ean: "SEM GTIN", // Código de barras padrão
          descricao: item.product_name,
          cfop: "5405", // Venda de mercadoria com substituição tributária
          unidade_comercial: item.products?.unit || "CX",
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: item.unit_price,
          valor_total_bruto: item.total_price,
          codigo_ean_tributavel: "SEM GTIN",
          unidade_tributavel: item.products?.unit || "CX",
          quantidade_tributavel: item.quantity,
          valor_unitario_tributavel: item.unit_price,
          
          // NCM e CEST - usar do produto ou padrão para pães
          codigo_ncm: item.products?.ncm || "19059090", // Outros produtos de padaria
          codigo_cest: "1706200", // CEST para produtos de padaria
          
          // ICMS - Substituição Tributária (conforme NFe anterior)
          icms_origem: 0, // Nacional
          icms_situacao_tributaria: "60", // ICMS cobrado por substituição tributária
          
          // PIS - Regime cumulativo
          pis_situacao_tributaria: "01", // Operação tributável com alíquota básica
          pis_aliquota_porcentual: 1.65, // 1,65% - corrigido conforme XML
          
          // COFINS - Regime cumulativo  
          cofins_situacao_tributaria: "01", // Operação tributável com alíquota básica
          cofins_aliquota_porcentual: 7.60, // 7,60% - corrigido conforme XML
          
          valor_total_tributos: item.total_price * 0.0925, // 9,25% (PIS + COFINS corrigido)
          
          // Indicador se compõe valor total
          indicador_total: 1 // Sim, compõe o valor total
        })),

        // Totais calculados
        valor_produtos: sale.total_amount,
        valor_total: sale.total_amount,
        
        // Peso total da nota (somar peso dos produtos)
        peso_liquido: orderItems.reduce((total: number, item: any) => {
          const weight = item.products?.weight || 1; // Peso padrão se não informado
          return total + (weight * item.quantity);
        }, 0),

        // Observações
        informacoes_adicionais_contribuinte: data.observations || `Venda ${sale.sale_number} - Pedido ${order.order_number}.`
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
      await supabase
        .from('sales')
        .update({
          status: 'invoiced',
          invoice_number: data.invoice_number,
          invoice_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', data.sale_id)

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