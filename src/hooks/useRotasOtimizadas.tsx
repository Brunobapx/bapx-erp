
import { useState, useEffect } from 'react';
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
  order_id: string;
}

const STORAGE_KEY = 'pedidos_roteirizacao';

// Funções auxiliares para localStorage
const saveToStorage = (pedidos: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

const loadFromStorage = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return [];
  }
};

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
};

export const useRotasOtimizadas = () => {
  const [loading, setLoading] = useState(false);
  const [rotas, setRotas] = useState<RotaOtimizada[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<PedidoDisponivel[]>([]);
  
  // Inicializar pedidosEnviados com dados do localStorage
  const [pedidosEnviados, setPedidosEnviados] = useState<any[]>(() => {
    const stored = loadFromStorage();
    console.log('Inicializando pedidosEnviados com dados do localStorage:', stored);
    return stored;
  });

  // Buscar pedidos automaticamente quando o hook for inicializado e houver pedidos salvos
  useEffect(() => {
    console.log('useEffect executado - pedidosEnviados:', pedidosEnviados);
    if (pedidosEnviados.length > 0) {
      console.log('Executando buscarPedidosDisponiveis automaticamente');
      buscarPedidosDisponiveis();
    }
  }, []); // Executar apenas na inicialização

  const adicionarPedidoParaRoterizacao = (saleData: any) => {
    console.log('Adicionando pedido para roteirização:', saleData);
    
    // Verificar se o pedido já foi adicionado
    const pedidosAtuais = loadFromStorage();
    const jaExiste = pedidosAtuais.find(p => p.order_id === saleData.order_id);
    
    if (!jaExiste) {
      const novoPedido = {
        id: saleData.order_id,
        order_id: saleData.order_id,
        sale_id: saleData.sale_id,
        sale_number: saleData.sale_number,
        client_name: saleData.client_name,
        total_amount: saleData.total_amount
      };
      
      const novosPedidos = [...pedidosAtuais, novoPedido];
      
      // Atualizar estado e localStorage
      setPedidosEnviados(novosPedidos);
      saveToStorage(novosPedidos);
      
      console.log('Pedido adicionado e salvo no localStorage:', novoPedido);
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

      // Carregar pedidos enviados mais recentes do localStorage
      const pedidosAtuais = loadFromStorage();
      console.log('Pedidos atuais do localStorage:', pedidosAtuais);

      // Se não há pedidos enviados, não buscar nada
      if (pedidosAtuais.length === 0) {
        console.log('Nenhum pedido enviado encontrado no localStorage');
        setPedidosDisponiveis([]);
        return;
      }

      // Buscar apenas os pedidos que foram enviados via botão "Romaneio"
      const orderIds = pedidosAtuais.map(p => p.order_id);
      console.log('Buscando pedidos com IDs:', orderIds);
      
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
        .in('id', orderIds);

      if (error) throw error;

      console.log('Dados dos pedidos encontrados:', data);

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
        
        // Encontrar os dados do pedido enviado
        const pedidoEnviado = pedidosAtuais.find(p => p.order_id === order.id);

        return {
          id: order.id,
          order_id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          delivery_address: deliveryAddress,
          total_weight: totalWeight,
          status: 'available',
          sale_id: sale?.id || pedidoEnviado?.sale_id,
          sale_number: sale?.sale_number || pedidoEnviado?.sale_number
        };
      });

      console.log('Pedidos processados:', processedOrders);
      setPedidosDisponiveis(processedOrders);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      toast.error('Erro ao carregar pedidos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const removerPedidoDaRoteirizacao = (orderId: string) => {
    const pedidosAtuais = loadFromStorage();
    const novosPedidos = pedidosAtuais.filter(p => p.order_id !== orderId);
    
    // Atualizar estado e localStorage
    setPedidosEnviados(novosPedidos);
    saveToStorage(novosPedidos);
    
    setPedidosDisponiveis(prev => prev.filter(pedido => pedido.order_id !== orderId));
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

  const limparTodosPedidos = () => {
    setPedidosEnviados([]);
    setPedidosDisponiveis([]);
    clearStorage();
    toast.success('Todos os pedidos foram removidos da roteirização');
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
    limparTodosPedidos,
    setRotas
  };
};
