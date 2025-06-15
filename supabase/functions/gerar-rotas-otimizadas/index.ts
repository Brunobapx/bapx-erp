import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Pedido {
  id: string
  endereco: string
  cliente?: string
}

interface Veiculo {
  id: string
  placa: string
  regiaoAtendida: string
  capacidade: number
}

interface RotaOtimizada {
  placa: string
  regiao: string
  paradas: Pedido[]
  link: string
}

function classificarRegiao(endereco: string): string {
  const enderecoLower = endereco.toLowerCase()
  
  if (enderecoLower.includes('norte') || 
      enderecoLower.includes('nova américa') || 
      enderecoLower.includes('madureira')) {
    return 'Zona Norte'
  }
  
  if (enderecoLower.includes('nova iguaçu') || 
      enderecoLower.includes('topshopping')) {
    return 'Baixada'
  }
  
  return 'Zona Sul / Centro / Niterói'
}

function gerarLinkGoogleMaps(origem: string, paradas: Pedido[]): string {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1'
  const originParam = `origin=${encodeURIComponent(origem)}`
  const destinationParam = `destination=${encodeURIComponent(origem)}`
  
  const waypoints = paradas.map(p => encodeURIComponent(p.endereco)).join('|')
  const waypointsParam = `waypoints=optimize:true|${waypoints}`
  
  return `${baseUrl}&${originParam}&${destinationParam}&${waypointsParam}`
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar autenticação JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar o usuário autenticado
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verificar se o usuário tem acesso ao módulo de rotas
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'Perfil de usuário não encontrado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { origem, pedidos }: { origem: string; pedidos: Pedido[] } = await req.json()

    if (!origem || !pedidos || !Array.isArray(pedidos)) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos. origem e pedidos são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar entrada para prevenir ataques
    if (origem.length > 500 || pedidos.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros excederam limites permitidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar veículos do banco apenas da empresa do usuário
    const { data: veiculos, error: veiculosError } = await supabase
      .from('vehicles')
      .select('id, license_plate, capacity, notes')
      .eq('status', 'active')
      .eq('company_id', userProfile.company_id)

    if (veiculosError) {
      console.error('Erro ao buscar veículos:', veiculosError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar veículos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log da operação para auditoria
    await supabase.rpc('log_security_event', {
      action_name: 'ROUTE_OPTIMIZATION_REQUEST',
      table_name: 'delivery_routes',
      record_id: null,
      old_data: null,
      new_data: { 
        user_id: userData.user.id,
        company_id: userProfile.company_id,
        origin: origem,
        orders_count: pedidos.length 
      }
    });

    // Mapear veículos para o formato esperado
    // Por enquanto, vamos usar as notes para definir a região atendida
    const veiculosFormatados: Veiculo[] = (veiculos || []).map(v => ({
      id: v.id,
      placa: v.license_plate,
      regiaoAtendida: v.notes || 'Zona Sul / Centro / Niterói', // fallback se não tiver região definida
      capacidade: v.capacity
    }))

    // 1. Agrupar pedidos por região
    const pedidosPorRegiao: { [regiao: string]: Pedido[] } = {}
    
    pedidos.forEach(pedido => {
      const regiao = classificarRegiao(pedido.endereco)
      if (!pedidosPorRegiao[regiao]) {
        pedidosPorRegiao[regiao] = []
      }
      pedidosPorRegiao[regiao].push(pedido)
    })

    console.log('Pedidos agrupados por região:', pedidosPorRegiao)

    // 2. Para cada região, distribuir pedidos entre veículos
    const rotasOtimizadas: RotaOtimizada[] = []

    Object.entries(pedidosPorRegiao).forEach(([regiao, pedidosRegiao]) => {
      // Buscar veículos da região
      const veiculosRegiao = veiculosFormatados.filter(v => 
        v.regiaoAtendida.toLowerCase().includes(regiao.toLowerCase()) ||
        regiao.toLowerCase().includes(v.regiaoAtendida.toLowerCase())
      )

      console.log(`Veículos para região ${regiao}:`, veiculosRegiao)

      if (veiculosRegiao.length === 0) {
        console.log(`Nenhum veículo encontrado para região ${regiao}, usando veículos genéricos`)
        // Se não há veículo específico, usar qualquer veículo disponível
        veiculosRegiao.push(...veiculosFormatados.slice(0, 1))
      }

      // 3. Distribuir pedidos entre veículos da região
      let pedidosRestantes = [...pedidosRegiao]
      
      veiculosRegiao.forEach(veiculo => {
        if (pedidosRestantes.length === 0) return

        const capacidadeVeiculo = Math.floor(veiculo.capacidade / 50) || 5 // Assumindo ~50kg por entrega, mínimo 5
        const pedidosVeiculo = pedidosRestantes.splice(0, capacidadeVeiculo)

        if (pedidosVeiculo.length > 0) {
          // 4. Gerar link do Google Maps
          const link = gerarLinkGoogleMaps(origem, pedidosVeiculo)

          rotasOtimizadas.push({
            placa: veiculo.placa,
            regiao: regiao,
            paradas: pedidosVeiculo,
            link: link
          })
        }
      })

      // Se ainda sobraram pedidos e não há mais veículos da região
      if (pedidosRestantes.length > 0) {
        console.log(`Sobraram ${pedidosRestantes.length} pedidos na região ${regiao}`)
        // Criar uma rota adicional com o primeiro veículo da região
        if (veiculosRegiao.length > 0) {
          const link = gerarLinkGoogleMaps(origem, pedidosRestantes)
          rotasOtimizadas.push({
            placa: `${veiculosRegiao[0].placa} (Extra)`,
            regiao: regiao,
            paradas: pedidosRestantes,
            link: link
          })
        }
      }
    })

    console.log('Rotas otimizadas geradas:', rotasOtimizadas)

    return new Response(
      JSON.stringify({ rotas: rotasOtimizadas }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função gerar-rotas-otimizadas:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
