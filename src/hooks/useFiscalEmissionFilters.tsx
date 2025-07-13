
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const useFiscalEmissionFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('recent');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      console.log('[FISCAL_EMISSION] Carregando notas fiscais...');

      const { data: invoices, error } = await supabase
        .from('fiscal_invoices')
        .select(`
          *,
          sales(sale_number, client_name),
          orders(order_number),
          clients(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Erro ao carregar NFes: ' + error.message);
      }

      console.log('[FISCAL_EMISSION] NFes carregadas:', invoices?.length || 0);
      setInvoices(invoices || []);
    } catch (error) {
      console.error('[FISCAL_EMISSION] Erro ao carregar NFes:', error);
      toast({ 
        title: "Erro", 
        description: error.message || 'Erro ao carregar notas fiscais',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices
    .filter(invoice => {
      const searchString = searchQuery.toLowerCase();
      if (typeFilter !== 'all' && invoice.invoice_type !== typeFilter) return false;
      if (statusFilter !== 'all') {
        const statusMap = {
          'Autorizada': 'authorized',
          'Pendente': 'pending',
          'Rejeitada': 'rejected',
          'Cancelada': 'cancelled'
        };
        if (invoice.status !== statusMap[statusFilter]) return false;
      }
      return (
        invoice.invoice_number.toLowerCase().includes(searchString) ||
        invoice.sales?.sale_number?.toLowerCase().includes(searchString) ||
        invoice.sales?.client_name?.toLowerCase().includes(searchString) ||
        invoice.clients?.name?.toLowerCase().includes(searchString) ||
        invoice.invoice_type.toLowerCase().includes(searchString) ||
        invoice.status.toLowerCase().includes(searchString)
      );
    })
    .sort((a, b) => {
      if (orderSort === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (orderSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (orderSort === 'greater') return b.total_amount - a.total_amount;
      if (orderSort === 'less') return a.total_amount - b.total_amount;
      return 0;
    })
    .map(invoice => ({
      id: invoice.invoice_number,
      type: invoice.invoice_type,
      saleId: invoice.sales?.sale_number || 'N/A',
      customer: invoice.sales?.client_name || invoice.clients?.name || 'N/A',
      value: invoice.total_amount,
      date: new Date(invoice.issue_date).toLocaleDateString('pt-BR'),
      status: invoice.status === 'authorized' ? 'Autorizada' : 
              invoice.status === 'pending' ? 'Pendente' : 
              invoice.status === 'rejected' ? 'Rejeitada' : 'Cancelada',
      key: invoice.invoice_key,
      originalInvoice: invoice
    }));

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

  const downloadDANFE = async (invoice: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se a NFe está autorizada
      if (invoice.status !== 'Autorizada') {
        toast({ 
          title: "Aviso", 
          description: "Só é possível baixar DANFE de NFe autorizada",
          variant: "destructive"
        });
        return;
      }

      toast({ title: "Download", description: "Preparando DANFE para download..." });

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'get_danfe_pdf',
          data: {
            reference: invoice.originalInvoice.focus_reference
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao baixar DANFE');
      }

      // Validar dados recebidos
      if (!data.fileData || !data.fileName) {
        throw new Error('Dados do arquivo inválidos');
      }

      // Decodificar Base64 e criar blob
      const binaryString = atob(data.fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Sucesso", description: "DANFE baixado com sucesso!" });
    } catch (error) {
      console.error('Erro ao baixar DANFE:', error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao baixar DANFE",
        variant: "destructive"
      });
    }
  };

  const downloadXML = async (invoice: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se a NFe está autorizada
      if (invoice.status !== 'Autorizada') {
        toast({ 
          title: "Aviso", 
          description: "Só é possível baixar XML de NFe autorizada",
          variant: "destructive"
        });
        return;
      }

      toast({ title: "Download", description: "Preparando XML para download..." });

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'get_xml',
          data: {
            reference: invoice.originalInvoice.focus_reference
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao baixar XML');
      }

      // Validar dados recebidos
      if (!data.fileData || !data.fileName) {
        throw new Error('Dados do arquivo inválidos');
      }

      // Validar se o conteúdo é um XML válido
      if (!data.fileData.includes('<?xml') || !data.fileData.includes('<NFe')) {
        throw new Error('Arquivo XML inválido recebido');
      }

      // Criar blob com o XML
      const blob = new Blob([data.fileData], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Sucesso", description: "XML baixado com sucesso!" });
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao baixar XML",
        variant: "destructive"
      });
    }
  };

  const checkStatus = async (invoice: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'check_nfe_status',
          data: {
            reference: invoice.originalInvoice.focus_reference,
            fiscal_invoice_id: invoice.originalInvoice.id
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw new Error(error.message);

      const status = data.status;
      if (status.status === 'autorizado') {
        toast({ title: "Status", description: "NFe autorizada com sucesso!" });
      } else if (status.status === 'rejeitado') {
        toast({ title: "Status", description: `NFe rejeitada: ${status.mensagem_erro}`, variant: "destructive" });
      } else {
        toast({ title: "Status", description: `Status: ${status.status}` });
      }

      // Recarregar lista
      setTimeout(() => loadInvoices(), 1000); // Aguardar 1s para sincronização
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao consultar status da NFe",
        variant: "destructive"
      });
    }
  };

  const handleEmitInvoice = (invoice: any) => {
    if (invoice.status === 'Pendente') {
      checkStatus(invoice);
    } else {
      downloadDANFE(invoice);
    }
  };

  const handleCreateInvoice = () => {
    toast({ title: "Criar Nota Fiscal", description: "Selecione uma venda para emitir a nota fiscal." });
  };

  return {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    orderSort, setOrderSort,
    filteredInvoices,
    handleEmitInvoice,
    handleCreateInvoice,
    formatCurrency,
    downloadDANFE,
    downloadXML,
    checkStatus,
    loading,
    refreshInvoices: loadInvoices
  };
};

export default useFiscalEmissionFilters;
