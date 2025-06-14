
import { useState } from 'react';
import { toast } from "@/hooks/use-toast";

const INVOICES = [
  { id: 'NFe-001', type: 'NFe', saleId: 'V-001', customer: 'Tech Solutions', value: 50000, date: '19/05/2025', status: 'Autorizada', key: '35250500012345678901234567890123456789012345' },
  { id: 'NFe-002', type: 'NFe', saleId: 'V-002', customer: 'Green Energy Inc', value: 75000, date: '18/05/2025', status: 'Pendente', key: '' },
  { id: 'NFCe-003', type: 'NFCe', saleId: 'V-003', customer: 'João Silva', value: 3500, date: '17/05/2025', status: 'Autorizada', key: '35250500012345678901234567890123456789054321' },
  { id: 'NFe-004', type: 'NFe', saleId: 'V-004', customer: 'Global Foods', value: 9800, date: '16/05/2025', status: 'Autorizada', key: '35250500012345678901234567890123456789098765' }
];

const useFiscalEmissionFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('recent');

  const filteredInvoices = INVOICES
    .filter(invoice => {
      const searchString = searchQuery.toLowerCase();
      if (typeFilter !== 'all' && invoice.type !== typeFilter) return false;
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      return (
        invoice.id.toLowerCase().includes(searchString) ||
        invoice.saleId.toLowerCase().includes(searchString) ||
        invoice.customer.toLowerCase().includes(searchString) ||
        invoice.type.toLowerCase().includes(searchString) ||
        invoice.status.toLowerCase().includes(searchString)
      );
    })
    .sort((a, b) => {
      if (orderSort === 'recent') return b.id.localeCompare(a.id);
      if (orderSort === 'oldest') return a.id.localeCompare(b.id);
      if (orderSort === 'greater') return b.value - a.value;
      if (orderSort === 'less') return a.value - b.value;
      return 0;
    });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);

  const handleEmitInvoice = (invoice: any) => {
    if (invoice.status === 'Pendente') {
      toast({ title: "Nota Fiscal Emitida", description: `${invoice.id} foi emitida com sucesso para ${invoice.customer}.` });
    } else {
      toast({ title: "Imprimir DANFE", description: `DANFE ${invoice.id} preparada para impressão.` });
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
    formatCurrency
  };
};

export default useFiscalEmissionFilters;
