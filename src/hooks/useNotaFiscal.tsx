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
      // RLS irá filtrar automaticamente por empresa
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

      if (data?.success) {
        toast.success('Nota fiscal enviada com sucesso!');
        await loadNotas();
        return data.nota;
      } else {
        // Exibir erro amigável retornado pela edge function
        const errorMessage = data?.error || 'Erro ao emitir nota';
        toast.error(errorMessage);
        throw new Error(errorMessage);
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
      // Verificar se a nota está autorizada e tem caminho_danfe
      if (nota.status !== 'autorizado') {
        toast.error('Apenas notas autorizadas podem ter o DANFE baixado');
        return;
      }

      if (!nota.json_resposta?.caminho_danfe) {
        toast.error('DANFE não disponível para esta nota');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      console.log('Baixando PDF para nota:', nota.id);

      // Para PDF, usar fetch direto com URL e anon key fixos
      const response = await fetch(`https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1/focus-nfe-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk'
        },
        body: JSON.stringify({
          action: 'obter_pdf',
          notaId: nota.id
        })
      });

      console.log('Resposta do fetch direto para PDF:', { 
        status: response.status, 
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/pdf')) {
        // É um PDF válido
        const blob = await response.blob();
        console.log('PDF blob recebido, tamanho:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `danfe-${nota.numero_nota || nota.focus_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('DANFE baixado com sucesso!');
      } else if (contentType?.includes('application/json')) {
        // É uma resposta JSON (provavelmente erro)
        const errorData = await response.json();
        console.error('Erro JSON retornado:', errorData);
        throw new Error(errorData.error || 'Erro desconhecido');
      } else {
        // Tentar como blob mesmo assim
        const blob = await response.blob();
        if (blob.size > 0) {
          console.log('Tentando download como blob genérico, tamanho:', blob.size);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `danfe-${nota.numero_nota || nota.focus_id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('DANFE baixado com sucesso!');
        } else {
          throw new Error(`Tipo de conteúdo inesperado: ${contentType}`);
        }
      }
    } catch (error) {
      console.error('Erro ao baixar DANFE:', error);
      toast.error(`Erro ao baixar DANFE: ${error.message}`);
    }
  };

  const baixarXML = async (nota: NotaEmitida) => {
    try {
      // Verificar se a nota está autorizada e tem caminho_xml_nota_fiscal
      if (nota.status !== 'autorizado') {
        toast.error('Apenas notas autorizadas podem ter o XML baixado');
        return;
      }

      if (!nota.json_resposta?.caminho_xml_nota_fiscal) {
        toast.error('XML não disponível para esta nota');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      console.log('Baixando XML para nota:', nota.id);

      const { data, error } = await supabase.functions.invoke('focus-nfe-api', {
        body: {
          action: 'obter_xml',
          notaId: nota.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Se recebemos uma resposta de texto XML, baixar o arquivo
      if (typeof data === 'string' && data.includes('<?xml')) {
        const blob = new Blob([data], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfe-${nota.numero_nota || nota.focus_id}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('XML baixado com sucesso!');
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast.error(`Erro ao baixar XML: ${error.message}`);
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