
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

export const useRotasOtimizadas = () => {
  const [loading, setLoading] = useState(false);
  const [rotas, setRotas] = useState<RotaOtimizada[]>([]);

  const gerarRotasOtimizadasComVeiculos = async (origem: string, pedidos: PedidoRota[]) => {
    try {
      setLoading(true);
      console.log('Gerando rotas otimizadas...', { origem, pedidos });

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
    gerarRotasOtimizadasComVeiculos,
    setRotas
  };
};
