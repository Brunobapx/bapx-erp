import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotaEmitida {
  id: string;
  tipo_nota: string;
  pedido_id: string;
  focus_id: string;
  numero_nota: string;
  serie: string;
  chave_acesso: string;
  status: string;
  xml_url: string;
  pdf_url: string;
  emitida_em: string;
  json_resposta: any;
}

export const useNotaFiscal = () => {
  const [notas, setNotas] = useState<NotaEmitida[]>([]);
  const [loading, setLoading] = useState(true);
  const [emittingNota, setEmittingNota] = useState(false);

  const loadNotas = async () => {
    try {
      const { data, error } = await supabase
        .from('notas_emitidas')
        .select('*')
        .order('emitida_em', { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      toast.error('Erro ao carregar notas emitidas');
    } finally {
      setLoading(false);
    }
  };

  const emitirNota = async (pedidoId: string) => {
    setEmittingNota(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('focus-nfe-api', {
        body: {
          action: 'emitir_nfe',
          pedidoId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Nota fiscal enviada com sucesso!');
        await loadNotas();
        return data.nota;
      } else {
        throw new Error(data.error || 'Erro ao emitir nota');
      }
    } catch (error) {
      console.error('Erro ao emitir nota:', error);
      toast.error(`Erro ao emitir nota: ${error.message}`);
      throw error;
    } finally {
      setEmittingNota(false);
    }
  };

  const consultarStatus = async (notaId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('focus-nfe-api', {
        body: {
          action: 'consultar_status',
          notaId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Status atualizado!');
        await loadNotas();
        return data.status;
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      toast.error('Erro ao consultar status da nota');
    }
  };

  const cancelarNota = async (notaId: string, motivo: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.functions.invoke('focus-nfe-api', {
        body: {
          action: 'cancelar_nfe',
          notaId,
          motivo
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Nota fiscal cancelada!');
        await loadNotas();
        return true;
      }
    } catch (error) {
      console.error('Erro ao cancelar nota:', error);
      toast.error('Erro ao cancelar nota fiscal');
      return false;
    }
  };

  const baixarPDF = async (nota: NotaEmitida) => {
    try {
      // Se a nota tem caminho_danfe na resposta, usar diretamente
      if (nota.json_resposta?.caminho_danfe) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const response = await fetch(`https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1/focus-nfe-api`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk'
          },
          body: JSON.stringify({
            action: 'baixar_danfe',
            caminhoDanfe: nota.json_resposta.caminho_danfe
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `danfe-${nota.numero_nota}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('DANFE baixado com sucesso!');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erro ao baixar DANFE');
        }
      } else {
        toast.error('DANFE não disponível para esta nota');
      }
    } catch (error) {
      console.error('Erro ao baixar DANFE:', error);
      toast.error('Erro ao baixar DANFE');
    }
  };

  const baixarXML = async (nota: NotaEmitida) => {
    try {
      // Se a nota tem caminho_xml_nota_fiscal na resposta, usar diretamente
      if (nota.json_resposta?.caminho_xml_nota_fiscal) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Usuário não autenticado');

        const response = await fetch(`https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1/focus-nfe-api`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk'
          },
          body: JSON.stringify({
            action: 'baixar_xml',
            caminhoXml: nota.json_resposta.caminho_xml_nota_fiscal
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `nfe-${nota.numero_nota}.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('XML baixado com sucesso!');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Erro ao baixar XML');
        }
      } else {
        toast.error('XML não disponível para esta nota');
      }
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast.error('Erro ao baixar XML');
    }
  };

  useEffect(() => {
    loadNotas();
  }, []);

  return {
    notas,
    loading,
    emittingNota,
    emitirNota,
    consultarStatus,
    cancelarNota,
    baixarPDF,
    baixarXML,
    loadNotas,
  };
};