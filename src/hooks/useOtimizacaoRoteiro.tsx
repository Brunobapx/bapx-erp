import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoRoteiro {
  id: string;
  order_number: string;
  client_name: string;
  endereco_completo: string;
  peso_total: number;
  items?: Array<{
    product_name: string;
    quantity: number;
    weight: number;
  }>;
  coordenadas?: {
    longitude: number;
    latitude: number;
  };
}

export interface VeiculoRoteiro {
  id: string;
  model: string;
  license_plate: string;
  capacity: number;
  driver_name?: string;
}

export interface RoteiroOtimizado {
  veiculo: VeiculoRoteiro;
  pedidos: PedidoRoteiro[];
  sequencia: number[];
  tempo_total: number;
  distancia_total: number;
  rota_detalhada: any;
}

export interface ResultadoOtimizacao {
  success: boolean;
  roteiros: RoteiroOtimizado[];
  coordenadas_origem: {
    longitude: number;
    latitude: number;
  };
  total_veiculos: number;
  total_pedidos: number;
  pedidos_nao_alocados: number;
  error?: string;
}

export const useOtimizacaoRoteiro = () => {
  const [loading, setLoading] = useState(false);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [roteiros, setRoteiros] = useState<RoteiroOtimizado[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<PedidoRoteiro[]>([]);

  const buscarPedidosDisponiveis = async (): Promise<PedidoRoteiro[]> => {
    try {
      setLoadingPedidos(true);
      console.log('Buscando pedidos liberados para venda...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw new Error('Erro ao buscar pedidos disponíveis');
      }

      const pedidosProcessados: PedidoRoteiro[] = (data || []).map(pedido => {
        // Corrigir acesso aos dados do cliente - clients é um objeto, não array
        const cliente = Array.isArray(pedido.clients) ? pedido.clients[0] : pedido.clients;
        const endereco_parts = [
          cliente?.address,
          cliente?.number,
          cliente?.complement,
          cliente?.bairro,
          cliente?.city,
          cliente?.state,
          cliente?.zip
        ].filter(Boolean);
        
        const endereco_completo = endereco_parts.join(', ');
        
        // Calcular peso total do pedido
        const peso_total = pedido.order_items.reduce((total: number, item: any) => {
          return total + (item.quantity * (item.products?.weight || 1));
        }, 0);

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
        };
      });

      console.log('Pedidos encontrados:', pedidosProcessados.length);
      setPedidosDisponiveis(pedidosProcessados);
      return pedidosProcessados;

    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error(error.message || 'Erro ao buscar pedidos disponíveis');
      return [];
    } finally {
      setLoadingPedidos(false);
    }
  };

  const otimizarRoteiroEntregas = async (
    enderecoOrigem: string, 
    pedidosSelecionados?: string[]
  ): Promise<ResultadoOtimizacao | null> => {
    try {
      setLoading(true);
      console.log('Iniciando otimização de roteiro para origem:', enderecoOrigem);
      console.log('Pedidos selecionados:', pedidosSelecionados);

      const { data, error } = await supabase.functions.invoke('otimizar-roteiro-entregas', {
        body: {
          endereco_origem: enderecoOrigem,
          pedidos_selecionados: pedidosSelecionados
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao otimizar roteiro');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro na otimização');
      }

      console.log('Roteiros otimizados recebidos:', data.roteiros);
      setRoteiros(data.roteiros);
      
      let message = `${data.total_veiculos} roteiro(s) otimizado(s) com ${data.total_pedidos} pedido(s)`;
      if (data.pedidos_nao_alocados > 0) {
        message += ` (${data.pedidos_nao_alocados} pedido(s) não alocado(s) por excesso de capacidade)`;
      }
      
      toast.success(message);
      
      return data;

    } catch (error: any) {
      console.error('Erro ao otimizar roteiro:', error);
      toast.error(error.message || 'Erro ao otimizar roteiro de entregas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportarRoteiroPDF = async (roteiro: RoteiroOtimizado) => {
    try {
      // Implementar exportação para PDF usando jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Roteiro de Entrega Otimizado', 20, 20);
      
      // Informações do veículo
      doc.setFontSize(14);
      doc.text(`Veículo: ${roteiro.veiculo.model} - ${roteiro.veiculo.license_plate}`, 20, 40);
      doc.text(`Motorista: ${roteiro.veiculo.driver_name || 'Não informado'}`, 20, 50);
      doc.text(`Capacidade: ${roteiro.veiculo.capacity}kg`, 20, 60);
      doc.text(`Tempo Total: ${Math.round(roteiro.tempo_total / 60)} minutos`, 20, 70);
      doc.text(`Distância Total: ${(roteiro.distancia_total / 1000).toFixed(2)} km`, 20, 80);
      
      // Lista de entregas
      doc.setFontSize(12);
      doc.text('Sequência de Entregas:', 20, 100);
      
      let yPosition = 110;
      roteiro.sequencia.forEach((jobIndex, index) => {
        const pedido = roteiro.pedidos[jobIndex - 1];
        if (pedido) {
          doc.text(`${index + 1}. ${pedido.client_name} - ${pedido.order_number}`, 25, yPosition);
          doc.text(`   ${pedido.endereco_completo}`, 25, yPosition + 7);
          doc.text(`   Peso: ${pedido.peso_total}kg`, 25, yPosition + 14);
          yPosition += 25;
        }
      });
      
      // Baixar PDF
      doc.save(`roteiro-${roteiro.veiculo.license_plate}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF do roteiro gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do roteiro');
    }
  };

  const enviarRoteiroWhatsApp = (roteiro: RoteiroOtimizado) => {
    try {
      // Gerar mensagem formatada para WhatsApp
      let mensagem = `🚛 *ROTEIRO DE ENTREGA*\n\n`;
      mensagem += `*Veículo:* ${roteiro.veiculo.model} - ${roteiro.veiculo.license_plate}\n`;
      if (roteiro.veiculo.driver_name) {
        mensagem += `*Motorista:* ${roteiro.veiculo.driver_name}\n`;
      }
      mensagem += `*Tempo Total:* ${Math.round(roteiro.tempo_total / 60)} minutos\n`;
      mensagem += `*Distância:* ${(roteiro.distancia_total / 1000).toFixed(2)} km\n\n`;
      mensagem += `*SEQUÊNCIA DE ENTREGAS:*\n\n`;
      
      roteiro.sequencia.forEach((jobIndex, index) => {
        const pedido = roteiro.pedidos[jobIndex - 1];
        if (pedido) {
          mensagem += `${index + 1}. *${pedido.client_name}*\n`;
          mensagem += `   Pedido: ${pedido.order_number}\n`;
          mensagem += `   Peso: ${pedido.peso_total}kg\n`;
          mensagem += `   ${pedido.endereco_completo}\n\n`;
        }
      });
      
      // Abrir WhatsApp Web com a mensagem
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('Roteiro preparado para envio via WhatsApp!');
      
    } catch (error) {
      console.error('Erro ao preparar mensagem WhatsApp:', error);
      toast.error('Erro ao preparar mensagem para WhatsApp');
    }
  };

  const limparRoteiros = () => {
    setRoteiros([]);
  };

  return {
    loading,
    loadingPedidos,
    roteiros,
    pedidosDisponiveis,
    buscarPedidosDisponiveis,
    otimizarRoteiroEntregas,
    exportarRoteiroPDF,
    enviarRoteiroWhatsApp,
    limparRoteiros
  };
};
