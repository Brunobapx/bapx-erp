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
        const focusResponse = await fetch(`${focusApiUrl}/v2/empresas`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(testToken + ':')
          }
        })

        console.log('Status da resposta Focus:', focusResponse.status)
        console.log('Headers da resposta:', Object.fromEntries(focusResponse.headers.entries()))

        if (focusResponse.ok) {
          const responseData = await focusResponse.text()
          console.log('Dados da resposta (sucesso):', responseData)
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Conexão estabelecida com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
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
      
      // Buscar dados da venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          orders!inner(
            *,
            order_items(
              *,
              products(*)
            )
          ),
          clients(*)
        `)
        .eq('id', data.sale_id)
        .single()

      if (saleError) {
        throw new Error('Erro ao buscar dados da venda: ' + saleError.message)
      }

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
        acc[setting.key] = JSON.parse(setting.value as string)
        return acc
      }, {} as Record<string, any>)

      // Montar dados da NFe para Focus NFe
      const nfeData = {
        natureza_operacao: "Venda",
        data_emissao: new Date().toISOString().split('T')[0],
        data_entrada_saida: new Date().toISOString().split('T')[0],
        tipo_documento: 1,
        finalidade_emissao: 1,
        cnpj_emitente: companyData.company_cnpj?.replace(/[^\d]/g, ''),
        nome_emitente: companyData.company_name,
        logradouro_emitente: companyData.company_street,
        numero_emitente: companyData.company_number,
        bairro_emitente: companyData.company_neighborhood,
        municipio_emitente: companyData.company_city,
        uf_emitente: companyData.company_state,
        cep_emitente: companyData.company_cep?.replace(/[^\d]/g, ''),
        inscricao_estadual_emitente: companyData.company_ie,
        
        // Dados do destinatário
        cpf_destinatario: sale.clients?.cpf?.replace(/[^\d]/g, ''),
        cnpj_destinatario: sale.clients?.cnpj?.replace(/[^\d]/g, ''),
        nome_destinatario: sale.clients?.name,
        logradouro_destinatario: sale.clients?.address,
        numero_destinatario: sale.clients?.number,
        bairro_destinatario: sale.clients?.bairro,
        municipio_destinatario: sale.clients?.city,
        uf_destinatario: sale.clients?.state,
        cep_destinatario: sale.clients?.zip?.replace(/[^\d]/g, ''),

        // Itens da nota
        itens: sale.orders.order_items.map((item: any, index: number) => ({
          numero_item: index + 1,
          codigo_produto: item.products?.code || item.product_id,
          descricao: item.product_name,
          cfop: "5102", // Venda de mercadoria
          unidade_comercial: item.products?.unit || "UN",
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: item.unit_price,
          valor_total_bruto: item.total_price,
          unidade_tributavel: item.products?.unit || "UN",
          quantidade_tributavel: item.quantity,
          valor_unitario_tributavel: item.unit_price,
          valor_total_tributos: 0,
          icms_origem: 0,
          icms_situacao_tributaria: "102",
          pis_situacao_tributaria: "07",
          cofins_situacao_tributaria: "07"
        })),

        // Observações
        informacoes_adicionais_contribuinte: data.observations || `Venda ${sale.sale_number} - Pedido ${sale.orders.order_number}`
      }

      // Enviar para Focus NFe
      const focusResponse = await fetch(`${focusApiUrl}/v2/nfe?ref=${sale.sale_number}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(configMap.focus_nfe_token + ':')
        },
        body: JSON.stringify(nfeData)
      })

      const focusResult = await focusResponse.json()

      if (!focusResponse.ok) {
        console.error('Erro Focus NFe:', focusResult)
        throw new Error(focusResult.erro_principal || 'Erro ao comunicar com Focus NFe')
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
        focus_result: focusResult
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

      return new Response(JSON.stringify({
        success: true,
        status: focusResult
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