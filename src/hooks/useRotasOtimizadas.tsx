
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
}

export const useRotasOtimizadas = () => {
  const [loading, setLoading] = useState(false);
  const [rotas, setRotas] = useState<RotaOtimizada[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<PedidoDisponivel[]>([]);

  const buscarPedidosDisponiveis = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar pedidos que estão prontos para entrega (confirmados em vendas)
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
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['sale_confirmed', 'released_for_sale']);

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

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          delivery_address: deliveryAddress,
          total_weight: totalWeight,
          status: 'available'
        };
      });

      setPedidosDisponiveis(processedOrders);
      console.log('Pedidos disponíveis carregados:', processedOrders);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      toast.error('Erro ao carregar pedidos disponíveis');
    } finally {
      setLoading(false);
    }
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
    buscarPedidosDisponiveis,
    gerarRotasOtimizadasComVeiculos,
    setRotas
  };
};
