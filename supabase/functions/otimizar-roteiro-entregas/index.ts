
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface Pedido {
  id: string;
  endereco_completo: string;
  peso: number;
  client_name: string;
  order_number: string;
}

interface Veiculo {
  id: string;
  model: string;
  license_plate: string;
  capacity: number;
}

interface Coordenada {
  longitude: number;
  latitude: number;
}

interface PedidoGeocodificado extends Pedido {
  coordenadas: Coordenada;
}

interface RoteiroOtimizado {
  veiculo: Veiculo;
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
    const { endereco_origem } = await req.json()
    
    // Obter a chave da API do OpenRouteService
    const orsApiKey = Deno.env.get('OPENROUTESERVICE_API_KEY')
    if (!orsApiKey) {
      throw new Error('Chave da API OpenRouteService não configurada')
    }

    console.log('Iniciando otimização de roteiro...')

    // 1. Obter pedidos selecionados (simulado para este exemplo)
    // Em produção, isso viria do banco de dados
    const pedidosSelecionados: Pedido[] = [
      {
        id: '1',
        endereco_completo: 'Rua das Flores, 123, Rio de Janeiro, RJ, 20000-000',
        peso: 10,
        client_name: 'Cliente A',
        order_number: 'PED-001'
      },
      {
        id: '2', 
        endereco_completo: 'Av. Copacabana, 456, Rio de Janeiro, RJ, 22000-000',
        peso: 20,
        client_name: 'Cliente B',
        order_number: 'PED-002'
      }
    ]

    // 2. Geocodificar endereços
    console.log('Geocodificando endereços...')
    const pedidosGeocodificados: PedidoGeocodificado[] = []
    
    for (const pedido of pedidosSelecionados) {
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
          
          console.log(`Geocodificado: ${pedido.endereco_completo} -> ${longitude}, ${latitude}`)
        }
      } catch (error) {
        console.error(`Erro ao geocodificar ${pedido.endereco_completo}:`, error)
      }
    }

    // Geocodificar endereço de origem
    const origemUrl = `https://api.openrouteservice.org/geocode/search?api_key=${orsApiKey}&text=${encodeURIComponent(endereco_origem)}`
    const origemResponse = await fetch(origemUrl)
    const origemData = await origemResponse.json()
    
    let coordenadasOrigem: Coordenada = { longitude: -43.1729, latitude: -22.9068 } // Rio de Janeiro padrão
    if (origemData.features && origemData.features.length > 0) {
      const [longitude, latitude] = origemData.features[0].geometry.coordinates
      coordenadasOrigem = { longitude, latitude }
    }

    // 3. Obter veículos ativos (simulado)
    const veiculosAtivos: Veiculo[] = [
      {
        id: '1',
        model: 'Mercedes Sprinter',
        license_plate: 'ABC-1234',
        capacity: 30
      },
      {
        id: '2',
        model: 'Ford Transit',
        license_plate: 'DEF-5678', 
        capacity: 25
      }
    ]

    // 4. Alocar pedidos aos veículos respeitando capacidade
    console.log('Alocando pedidos aos veículos...')
    const alocacoes: { veiculo: Veiculo; pedidos: PedidoGeocodificado[] }[] = []
    
    let pedidosRestantes = [...pedidosGeocodificados]
    
    for (const veiculo of veiculosAtivos) {
      const pedidosDoVeiculo: PedidoGeocodificado[] = []
      let pesoTotal = 0
      
      for (let i = pedidosRestantes.length - 1; i >= 0; i--) {
        const pedido = pedidosRestantes[i]
        if (pesoTotal + pedido.peso <= veiculo.capacity) {
          pedidosDoVeiculo.push(pedido)
          pesoTotal += pedido.peso
          pedidosRestantes.splice(i, 1)
        }
      }
      
      if (pedidosDoVeiculo.length > 0) {
        alocacoes.push({ veiculo, pedidos: pedidosDoVeiculo })
      }
    }

    // 5. Otimizar rotas para cada veículo
    console.log('Otimizando rotas...')
    const roteirosOtimizados: RoteiroOtimizado[] = []
    
    for (const alocacao of alocacoes) {
      try {
        const jobs = alocacao.pedidos.map((pedido, index) => ({
          id: index + 1,
          location: [pedido.coordenadas.longitude, pedido.coordenadas.latitude],
          amount: [pedido.peso]
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
        
        console.log('Enviando para OpenRouteService:', JSON.stringify(requestBody, null, 2))
        
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
        console.log('Resposta da otimização:', JSON.stringify(optimizationData, null, 2))
        
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
        total_pedidos: pedidosGeocodificados.length
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
