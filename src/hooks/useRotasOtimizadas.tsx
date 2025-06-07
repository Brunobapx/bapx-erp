
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface PedidoRota {
  id: string;
  endereco: string;
  cliente?: string;
}

export interface RotaOtimizada {
  placa: string;
  regiao: string;
  paradas: PedidoRota[];
  link: string;
}

export interface PedidoDisponivel {
  id: string;
  order_number: string;
  client_name: string;
  delivery_address: string;
  total_weight: number;
  status: string;
  sale_id?: string;
  sale_number?: string;
}

export const useRotasOtimizadas = () => {
  const [loading, setLoading] = useState(false);
  const [rotas, setRotas] = useState<RotaOtimizada[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<PedidoDisponivel[]>([]);
  const [pedidosEnviados, setPedidosEnviados] = useState<string[]>([]);

  const adicionarPedidoParaRoterizacao = (saleData: any) => {
    console.log('Adicionando pedido para roteirização:', saleData);
    
    // Adicionar o pedido à lista de pedidos enviados
    if (!pedidosEnviados.includes(saleData.order_id)) {
      setPedidosEnviados(prev => [...prev, saleData.order_id]);
      toast.success('Pedido adicionado à lista de roteirização!');
    } else {
      toast.info('Pedido já está na lista de roteirização');
    }
  };

  const buscarPedidosDisponiveis = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Se não há pedidos enviados, não buscar nada
      if (pedidosEnviados.length === 0) {
        setPedidosDisponiveis([]);
        return;
      }

      // Buscar apenas os pedidos que foram enviados via botão "Gerar Romaneio"
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          client_name,
          clients!inner(address, city, state),
          order_items(
            quantity,
            products(weight)
          ),
          sales(
            id,
            sale_number
          )
        `)
        .eq('user_id', user.id)
        .in('id', pedidosEnviados);

      if (error) throw error;

      // Processar os dados para calcular peso total e endereço de entrega
      const processedOrders = (data || []).map(order => {
        const totalWeight = (order.order_items || []).reduce((sum: number, item: any) => {
          return sum + (item.quantity * (item.products?.weight || 1));
        }, 0);

        const client = Array.isArray(order.clients) ? order.clients[0] : order.clients;
        const deliveryAddress = client 
          ? `${client.address}, ${client.city} - ${client.state}`
          : 'Endereço não informado';

        const sale = Array.isArray(order.sales) ? order.sales[0] : order.sales;

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          delivery_address: deliveryAddress,
          total_weight: totalWeight,
          status: 'available',
          sale_id: sale?.id,
          sale_number: sale?.sale_number
        };
      });

      setPedidosDisponiveis(processedOrders);
      console.log('Pedidos disponíveis para roteirização:', processedOrders);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      toast.error('Erro ao carregar pedidos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const removerPedidoDaRoteirizacao = (orderId: string) => {
    setPedidosEnviados(prev => prev.filter(id => id !== orderId));
    setPedidosDisponiveis(prev => prev.filter(pedido => pedido.id !== orderId));
    toast.success('Pedido removido da roteirização');
  };

  const gerarRotasOtimizadasComVeiculos = async (origem: string, pedidosSelecionados: string[]) => {
    try {
      setLoading(true);
      console.log('Gerando rotas otimizadas...', { origem, pedidosSelecionados });

      // Converter pedidos selecionados para o formato esperado pela função
      const pedidos = pedidosDisponiveis
        .filter(pedido => pedidosSelecionados.includes(pedido.id))
        .map(pedido => ({
          id: pedido.id,
          endereco: pedido.delivery_address,
          cliente: pedido.client_name
        }));

      const { data, error } = await supabase.functions.invoke('gerar-rotas-otimizadas', {
        body: {
          origem,
          pedidos
        }
      });

      if (error) {
        console.error('Erro na função de rotas:', error);
        throw error;
      }

      if (!data || !data.rotas) {
        throw new Error('Resposta inválida da função de rotas');
      }

      console.log('Rotas geradas:', data.rotas);
      setRotas(data.rotas);
      toast.success(`${data.rotas.length} rotas otimizadas geradas com sucesso!`);
      
      return data.rotas;
    } catch (error: any) {
      console.error('Erro ao gerar rotas otimizadas:', error);
      toast.error('Erro ao gerar rotas otimizadas: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    rotas,
    loading,
    pedidosDisponiveis,
    pedidosEnviados,
    buscarPedidosDisponiveis,
    gerarRotasOtimizadasComVeiculos,
    adicionarPedidoParaRoterizacao,
    removerPedidoDaRoteirizacao,
    setRotas
  };
};
