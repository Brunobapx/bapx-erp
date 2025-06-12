
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package } from 'lucide-react';
import StageAlert from '@/components/Alerts/StageAlert';
import { usePackaging } from '@/hooks/usePackaging';
import { usePackagingFilters } from '@/hooks/usePackagingFilters';
import { usePackagingSummary } from '@/hooks/usePackagingSummary';
import { PackagingFilters } from '@/components/Packaging/PackagingFilters';
import { PackagingTable } from '@/components/Packaging/PackagingTable';
import { PackagingSummaryTable } from '@/components/Packaging/PackagingSummaryTable';

const PackagingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'packaging' as const,
      message: 'Embalagem #EMB-003 aguardando confirmação há 1 dia',
      time: '1 dia'
    }
  ]);

  const { packagings, loading, updatePackagingStatus, refreshPackagings } = usePackaging();

  // Filter items based on search query and status filter
  const filteredItems = usePackagingFilters(packagings, searchQuery, statusFilter);

  // Get packaging summary
  const packagingSummary = usePackagingSummary(packagings);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleViewItem = (e, item) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleEditItem = (e, item) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (e, item) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a embalagem ${item.packaging_number}?`)) {
      // Implementar exclusão se necessário
      refreshPackagings();
    }
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApprovePackaging = async (data) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'approved', data.quantityPackaged, data.qualityCheck);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleNextStage = async (data) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'in_progress', data.quantityPackaged);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleCreatePackaging = () => {
    const newPackaging = {
      id: 'new',
      packaging_number: 'NOVO',
      product_name: '',
      quantity_to_package: 1,
      quantity_packaged: 0,
      status: 'pending' as const,
      quality_check: false,
      client_name: '',
      order_number: ''
    };
    
    setSelectedItem(newPackaging);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      refreshPackagings();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Embalagem</h1>
          <p className="text-muted-foreground">Gerencie todos os produtos para embalagem.</p>
        </div>
        <Button onClick={handleCreatePackaging}>
          <Package className="mr-2 h-4 w-4" /> Nova Embalagem
        </Button>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Embalagens</TabsTrigger>
          <TabsTrigger value="summary">Resumo da Embalagem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <PackagingFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          
          <Card>
            <CardContent className="p-0">
              <PackagingTable
                packagings={filteredItems}
                loading={loading}
                onItemClick={handleItemClick}
                onViewItem={handleViewItem}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                formatDate={formatDate}
                getStatusBadgeClass={getStatusBadgeClass}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <PackagingSummaryTable summary={packagingSummary} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        stage="packaging"
        orderData={selectedItem || {
          id: 'NOVO', 
          product_name: '', 
          quantity_to_package: 1, 
          customer: '',
          client_name: '',
          order_number: ''
        }}
        onApprove={handleApprovePackaging}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default PackagingPage;
