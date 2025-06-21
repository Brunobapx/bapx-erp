
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

interface PedidoCompleto {
  id: string;
  order_number: string;
  client_name: string;
  endereco_completo: string;
  peso_total: number;
  items: Array<{
    product_name: string;
    quantity: number;
    weight: number;
  }>;
}

interface VeiculoCompleto {
  id: string;
  model: string;
  license_plate: string;
  capacity: number;
  driver_name?: string;
}

interface Coordenada {
  longitude: number;
  latitude: number;
}

interface PedidoGeocodificado extends PedidoCompleto {
  coordenadas: Coordenada;
}

interface RoteiroOtimizado {
  veiculo: VeiculoCompleto;
  pedidos: PedidoGeocodificado[];
  sequencia: number[];
  tempo_total: number;
  distancia_total: number;
  rota_detalhada: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endereco_origem, pedidos_selecionados } = await req.json()
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Obter a chave da API do OpenRouteService
    const orsApiKey = Deno.env.get('OPENROUTESERVICE_API_KEY')
    if (!orsApiKey) {
      throw new Error('Chave da API OpenRouteService não configurada')
    }

    console.log('Iniciando otimização de roteiro com dados reais...')
    console.log('Pedidos selecionados:', pedidos_selecionados)

    // 1. Buscar pedidos selecionados do banco
    let pedidosQuery = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        client_name,
        client_id,
        clients!inner(address, number, complement, bairro, city, state, zip),
        order_items!inner(product_name, quantity, products!inner(weight))
      `)
      .eq('status', 'released_for_sale')

    if (pedidos_selecionados && pedidos_selecionados.length > 0) {
      pedidosQuery = pedidosQuery.in('id', pedidos_selecionados)
    }

    const { data: pedidosData, error: pedidosError } = await pedidosQuery

    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError)
      throw new Error('Erro ao buscar pedidos do banco de dados')
    }

    if (!pedidosData || pedidosData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum pedido liberado para venda encontrado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 2. Processar pedidos e construir endereços
    const pedidosProcessados: PedidoCompleto[] = pedidosData.map(pedido => {
      const cliente = pedido.clients
      const endereco_parts = [
        cliente.address,
        cliente.number,
        cliente.complement,
        cliente.bairro,
        cliente.city,
        cliente.state,
        cliente.zip
      ].filter(Boolean)
      
      const endereco_completo = endereco_parts.join(', ')
      
      // Calcular peso total do pedido
      const peso_total = pedido.order_items.reduce((total: number, item: any) => {
        return total + (item.quantity * (item.products?.weight || 1))
      }, 0)

      return {
        id: pedido.id,
        order_number: pedido.order_number,
        client_name: pedido.client_name,
        endereco_completo,
        peso_total,
        items: pedido.order_items.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          weight: item.products?.weight || 1
        }))
      }
    })

    console.log('Pedidos processados:', pedidosProcessados.length)

    // 3. Buscar veículos ativos
    const { data: veiculosData, error: veiculosError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')

    if (veiculosError) {
      console.error('Erro ao buscar veículos:', veiculosError)
      throw new Error('Erro ao buscar veículos do banco de dados')
    }

    if (!veiculosData || veiculosData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nenhum veículo ativo encontrado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('Veículos encontrados:', veiculosData.length)

    // 4. Geocodificar endereços dos pedidos
    console.log('Geocodificando endereços...')
    const pedidosGeocodificados: PedidoGeocodificado[] = []
    
    for (const pedido of pedidosProcessados) {
      try {
        const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${orsApiKey}&text=${encodeURIComponent(pedido.endereco_completo)}`
        
        const geocodeResponse = await fetch(geocodeUrl)
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [longitude, latitude] = geocodeData.features[0].geometry.coordinates
          
          pedidosGeocodificados.push({
            ...pedido,
            coordenadas: { longitude, latitude }
          })
          
          console.log(`Geocodificado: ${pedido.client_name} -> ${longitude}, ${latitude}`)
        } else {
          console.warn(`Não foi possível geocodificar: ${pedido.endereco_completo}`)
        }
      } catch (error) {
        console.error(`Erro ao geocodificar ${pedido.endereco_completo}:`, error)
      }
    }

    if (pedidosGeocodificados.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível geocodificar nenhum endereço'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 5. Geocodificar endereço de origem
    const origemUrl = `https://api.openrouteservice.org/geocode/search?api_key=${orsApiKey}&text=${encodeURIComponent(endereco_origem)}`
    const origemResponse = await fetch(origemUrl)
    const origemData = await origemResponse.json()
    
    let coordenadasOrigem: Coordenada = { longitude: -43.1729, latitude: -22.9068 } // Rio de Janeiro padrão
    if (origemData.features && origemData.features.length > 0) {
      const [longitude, latitude] = origemData.features[0].geometry.coordinates
      coordenadasOrigem = { longitude, latitude }
      console.log(`Origem geocodificada: ${endereco_origem} -> ${longitude}, ${latitude}`)
    }

    // 6. Alocar pedidos aos veículos respeitando capacidade
    console.log('Alocando pedidos aos veículos...')
    const alocacoes: { veiculo: VeiculoCompleto; pedidos: PedidoGeocodificado[] }[] = []
    
    let pedidosRestantes = [...pedidosGeocodificados]
    
    for (const veiculo of veiculosData) {
      const pedidosDoVeiculo: PedidoGeocodificado[] = []
      let pesoTotal = 0
      
      for (let i = pedidosRestantes.length - 1; i >= 0; i--) {
        const pedido = pedidosRestantes[i]
        if (pesoTotal + pedido.peso_total <= veiculo.capacity) {
          pedidosDoVeiculo.push(pedido)
          pesoTotal += pedido.peso_total
          pedidosRestantes.splice(i, 1)
        }
      }
      
      if (pedidosDoVeiculo.length > 0) {
        alocacoes.push({ 
          veiculo: {
            id: veiculo.id,
            model: veiculo.model,
            license_plate: veiculo.license_plate,
            capacity: veiculo.capacity,
            driver_name: veiculo.driver_name
          }, 
          pedidos: pedidosDoVeiculo 
        })
        console.log(`Veículo ${veiculo.license_plate}: ${pedidosDoVeiculo.length} pedidos, ${pesoTotal}kg`)
      }
    }

    // 7. Otimizar rotas para cada veículo
    console.log('Otimizando rotas...')
    const roteirosOtimizados: RoteiroOtimizado[] = []
    
    for (const alocacao of alocacoes) {
      try {
        const jobs = alocacao.pedidos.map((pedido, index) => ({
          id: index + 1,
          location: [pedido.coordenadas.longitude, pedido.coordenadas.latitude],
          amount: [pedido.peso_total]
        }))
        
        const requestBody = {
          jobs,
          vehicles: [{
            id: 1,
            profile: "driving-car",
            start: [coordenadasOrigem.longitude, coordenadasOrigem.latitude],
            capacity: [alocacao.veiculo.capacity]
          }]
        }
        
        console.log(`Otimizando rota para veículo ${alocacao.veiculo.license_plate}`)
        
        const optimizationResponse = await fetch('https://api.openrouteservice.org/optimization', {
          method: 'POST',
          headers: {
            'Authorization': orsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (!optimizationResponse.ok) {
          const errorText = await optimizationResponse.text()
          console.error('Erro da API OpenRouteService:', errorText)
          throw new Error(`Erro na otimização: ${optimizationResponse.status}`)
        }
        
        const optimizationData = await optimizationResponse.json()
        
        if (optimizationData.routes && optimizationData.routes.length > 0) {
          const route = optimizationData.routes[0]
          
          roteirosOtimizados.push({
            veiculo: alocacao.veiculo,
            pedidos: alocacao.pedidos,
            sequencia: route.steps.filter((step: any) => step.type === 'job').map((step: any) => step.job),
            tempo_total: route.duration,
            distancia_total: route.distance,
            rota_detalhada: route
          })
        }
        
      } catch (error) {
        console.error(`Erro ao otimizar rota para veículo ${alocacao.veiculo.license_plate}:`, error)
      }
    }

    console.log('Roteiros otimizados:', roteirosOtimizados.length)

    return new Response(
      JSON.stringify({
        success: true,
        roteiros: roteirosOtimizados,
        coordenadas_origem: coordenadasOrigem,
        total_veiculos: roteirosOtimizados.length,
        total_pedidos: pedidosGeocodificados.length,
        pedidos_nao_alocados: pedidosRestantes.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erro na otimização de roteiro:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
