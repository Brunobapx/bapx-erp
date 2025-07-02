import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Box } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StageAlert from '@/components/Alerts/StageAlert';
import { ProductionFilters } from '@/components/Production/ProductionFilters';
import { ProductionTable } from '@/components/Production/ProductionTable';
import { ProductionSummaryTable } from '@/components/Production/ProductionSummaryTable';
import { InternalProductionTab } from '@/components/Production/InternalProductionTab';
import { useProduction } from '@/hooks/useProduction';
import { useProductionSummary } from '@/hooks/useProductionSummary';
import { useProductionFilters } from '@/hooks/useProductionFilters';
import { Production, AlertType } from '@/types/production';

const ProductionPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Production | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [orderSort, setOrderSort] = useState('recent'); // novo controle
  const [alerts, setAlerts] = useState<AlertType[]>([
    {
      id: 'alert-1',
      type: 'production' as const,
      message: 'Produção #PR-002 aguardando aprovação há 2 dias',
      time: '2 dias'
    },
    {
      id: 'alert-2',
      type: 'production' as const,
      message: 'Material para Produção #PR-005 está em falta',
      time: '4 horas'
    }
  ]);

  const { productions, loading, updateProductionStatus, refreshProductions } = useProduction();
  const productionSummary = useProductionSummary(productions);
  const filteredItems = useProductionFilters(productions, searchQuery, statusFilter, orderSort);

  const handleSendToPackaging = async (e: React.MouseEvent, item: Production) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja enviar a produção ${item.production_number} para embalagem?`)) {
      await updateProductionStatus(item.id, 'approved', item.quantity_produced);
    }
  };

  const canSendToPackaging = (item: Production) => {
    return item.status === 'completed' && item.quantity_produced > 0;
  };

  const handleItemClick = (item: Production) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleViewItem = (e: React.MouseEvent, item: Production) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleEditItem = (e: React.MouseEvent, item: Production) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (e: React.MouseEvent, item: Production) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a produção ${item.production_number}?`)) {
      refreshProductions();
    }
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApproveProduction = async (data: any) => {
    if (selectedItem) {
      console.log('Aprovando produção com quantidade:', data.quantity);
      const success = await updateProductionStatus(selectedItem.id, 'approved', data.quantity);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleNextStage = async (data: any) => {
    if (selectedItem) {
      const success = await updateProductionStatus(selectedItem.id, 'in_progress', data.quantity);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleCreateProduction = () => {
    const newProduction: Production = {
      id: 'new',
      production_number: 'NOVO',
      order_item_id: '',
      product_id: '',
      product_name: '',
      quantity_requested: 1,
      quantity_produced: 0,
      status: 'pending' as const,
      start_date: new Date().toISOString().split('T')[0],
    };
    
    setSelectedItem(newProduction);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      refreshProductions();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produção</h1>
          <p className="text-muted-foreground">Gerencie todos os itens em produção.</p>
        </div>
        <Button onClick={handleCreateProduction}>
          <Box className="mr-2 h-4 w-4" /> Nova Produção
        </Button>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual">Produções Individuais</TabsTrigger>
          <TabsTrigger value="internal">Produção Interna</TabsTrigger>
          <TabsTrigger value="summary">Resumo por Produto</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <ProductionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            orderSort={orderSort}
            setOrderSort={setOrderSort}
          />
          
          <ProductionTable
            filteredItems={filteredItems}
            loading={loading}
            onItemClick={handleItemClick}
            onViewItem={handleViewItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onSendToPackaging={handleSendToPackaging}
            canSendToPackaging={canSendToPackaging}
          />
        </TabsContent>

        <TabsContent value="internal" className="space-y-6">
          <InternalProductionTab />
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <ProductionSummaryTable
            productionSummary={productionSummary}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        stage="production"
        orderData={selectedItem || {
          id: 'NOVO', 
          product_name: '', 
          quantity_requested: 1, 
          customer: ''
        }}
        onApprove={handleApproveProduction}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default ProductionPage;
