import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { InternalProductionModal } from './InternalProductionModal';
import { InternalProductionTable } from './InternalProductionTable';
import { InternalProductionFilters } from './InternalProductionFilters';
import { EditInternalProductionModal } from './EditInternalProductionModal';
import { toast } from "sonner";

interface Production {
  id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: string;
  notes?: string;
}

export const InternalProductionTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');

  const handleEditProduction = (production: Production) => {
    setSelectedProduction(production);
    setShowEditModal(true);
  };

  const handleGenerateReport = () => {
    // Validar se há filtros de data
    if (!dateFrom && !dateTo) {
      toast.error('Selecione pelo menos uma data para gerar o romaneio');
      return;
    }

    // Aqui implementaríamos a geração do romaneio
    toast.success('Gerando romaneio da produção...');
    // TODO: Implementar geração de PDF/relatório
  };

  const handleUpdate = () => {
    // Trigger para atualizar a tabela
    window.location.reload(); // Simples reload por enquanto
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Produção Interna</h2>
          <p className="text-muted-foreground">
            Gerencie produções internas diárias para alimentar o estoque
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Produção Interna
        </Button>
      </div>

      <InternalProductionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onGenerateReport={handleGenerateReport}
      />

      <InternalProductionTable
        searchQuery={searchQuery}
        dateFrom={dateFrom}
        dateTo={dateTo}
        statusFilter={statusFilter}
        onEditProduction={handleEditProduction}
      />

      <InternalProductionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />

      <EditInternalProductionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        production={selectedProduction}
        onUpdate={handleUpdate}
      />
    </div>
  );
};