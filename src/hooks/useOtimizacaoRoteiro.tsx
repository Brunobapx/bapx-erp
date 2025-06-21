
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoRoteiro {
  id: string;
  endereco_completo: string;
  peso: number;
  client_name: string;
  order_number: string;
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
  error?: string;
}

export const useOtimizacaoRoteiro = () => {
  const [loading, setLoading] = useState(false);
  const [roteiros, setRoteiros] = useState<RoteiroOtimizado[]>([]);

  const otimizarRoteiroEntregas = async (enderecoOrigem: string): Promise<ResultadoOtimizacao | null> => {
    try {
      setLoading(true);
      console.log('Iniciando otimização de roteiro para origem:', enderecoOrigem);

      const { data, error } = await supabase.functions.invoke('otimizar-roteiro-entregas', {
        body: {
          endereco_origem: enderecoOrigem
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
      
      toast.success(`${data.total_veiculos} roteiro(s) otimizado(s) com ${data.total_pedidos} pedido(s)`);
      
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
      doc.text(`Capacidade: ${roteiro.veiculo.capacity}kg`, 20, 50);
      doc.text(`Tempo Total: ${Math.round(roteiro.tempo_total / 60)} minutos`, 20, 60);
      doc.text(`Distância Total: ${(roteiro.distancia_total / 1000).toFixed(2)} km`, 20, 70);
      
      // Lista de entregas
      doc.setFontSize(12);
      doc.text('Sequência de Entregas:', 20, 90);
      
      let yPosition = 100;
      roteiro.sequencia.forEach((jobIndex, index) => {
        const pedido = roteiro.pedidos[jobIndex - 1];
        if (pedido) {
          doc.text(`${index + 1}. ${pedido.client_name} - ${pedido.order_number}`, 25, yPosition);
          yPosition += 10;
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
      mensagem += `*Tempo Total:* ${Math.round(roteiro.tempo_total / 60)} minutos\n`;
      mensagem += `*Distância:* ${(roteiro.distancia_total / 1000).toFixed(2)} km\n\n`;
      mensagem += `*SEQUÊNCIA DE ENTREGAS:*\n\n`;
      
      roteiro.sequencia.forEach((jobIndex, index) => {
        const pedido = roteiro.pedidos[jobIndex - 1];
        if (pedido) {
          mensagem += `${index + 1}. *${pedido.client_name}*\n`;
          mensagem += `   Pedido: ${pedido.order_number}\n`;
          mensagem += `   Peso: ${pedido.peso}kg\n\n`;
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
    roteiros,
    otimizarRoteiroEntregas,
    exportarRoteiroPDF,
    enviarRoteiroWhatsApp,
    limparRoteiros
  };
};
