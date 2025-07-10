
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('focus-nfe-emission', {
        body: {
          action: 'list_invoices'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar NFes');
      }

      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Erro ao carregar NFes:', error);
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
        invoice.sales?.sale_number.toLowerCase().includes(searchString) ||
        invoice.sales?.client_name.toLowerCase().includes(searchString) ||
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
      saleId: invoice.sales?.sale_number,
      customer: invoice.sales?.client_name,
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

      // Criar link para download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Sucesso", description: "DANFE baixado com sucesso!" });
    } catch (error) {
      console.error('Erro ao baixar DANFE:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao baixar DANFE",
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

      // Criar link para download
      const blob = new Blob([data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFe-${invoice.id}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Sucesso", description: "XML baixado com sucesso!" });
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao baixar XML",
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
      await loadInvoices();
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
