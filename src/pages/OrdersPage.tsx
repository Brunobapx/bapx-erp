import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdersHeader } from '@/components/Orders/OrdersHeader';
import { OrdersFilters } from '@/components/Orders/OrdersFilters';
import { OrdersTable } from '@/components/Orders/OrdersTable';
import { OrdersExportFilters } from '@/components/Orders/OrdersExportFilters';
import { ImportExportButtons } from '@/components/ImportExport/ImportExportButtons';
import { OrderImportModal } from '@/components/Orders/OrderImportModal';
import { ExportModal } from '@/components/ImportExport/ExportModal';
import { useOrders, Order } from '@/hooks/useOrders';
import { useOrderImportExport } from '@/hooks/useOrderImportExport';
import { OrderDetailsModal } from '@/components/Orders/OrderDetailsModal';
import { CancelOrderModal } from '@/components/Orders/CancelOrderModal';
import { useOrderProductCheck } from '@/hooks/useOrderProductCheck';
import { useCancelOrder } from '@/hooks/useCancelOrder';

const OrdersPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSort, setOrderSort] = useState('recent'); // novo estado de ordenação
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportMode, setShowExportMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Custom hook for orders data
  const { orders, loading, deleteOrder, sendToProduction, refreshOrders, isOrderCompleted, getFirstOrderItem, translateStatus } = useOrders();
  
  // Hook para verificar produtos de venda direta
  const { hasDirectSaleProduct } = useOrderProductCheck(orders);
  
  // Hook para cancelamento de pedidos
  const { cancelOrder, loading: cancelLoading } = useCancelOrder();
  
  // Import/Export hook
  const { 
    isImporting, 
    isExporting, 
    orderHeaders, 
    generateTemplate, 
    exportOrders, 
    importOrders 
  } = useOrderImportExport();

  // Check if we need to refresh orders (when returning from form)
  useEffect(() => {
    if (location.state && location.state.refresh) {
      console.log("Refreshing orders after form submission");
      refreshOrders();
      // Clear the state to avoid unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshOrders]);

  // Filtro (SEARCH + STATUS)
  const filtered = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const firstItem = getFirstOrderItem(order);
    const matchesSearch = 
      order.id?.toString().toLowerCase().includes(searchString) ||
      order.client_name?.toLowerCase().includes(searchString) ||
      firstItem?.product_name?.toLowerCase().includes(searchString) ||
      translateStatus(order.status)?.toLowerCase().includes(searchString) ||
      order.seller_name?.toLowerCase().includes(searchString);
    
    // Status filter
    const isCompleted = isOrderCompleted(order.status);
    if (statusFilter === 'active' && isCompleted) {
      return false;
    }
    if (statusFilter === 'completed' && !isCompleted) {
      return false;
    }

    return matchesSearch;
  });

  // Ordenação
  const sortedOrders = [...filtered].sort((a, b) => {
    if (orderSort === "recent") {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
    if (orderSort === "oldest") {
      return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    }
    if (orderSort === "client_az") {
      return (a.client_name || '').localeCompare(b.client_name || '');
    }
    if (orderSort === "client_za") {
      return (b.client_name || '').localeCompare(a.client_name || '');
    }
    return 0;
  });

  // Event handlers
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleViewOrder = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleEditOrder = (order) => {
    navigate(`/pedidos/${order.id}`);
  };

  const handleDeleteOrder = async (e, order) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o pedido ${order.order_number}?`)) {
      await deleteOrder(order.id);
    }
  };

  const handleSendToProduction = async (e, order) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja enviar o pedido ${order.order_number} para produção?`)) {
      await sendToProduction(order.id);
    }
  };

  const handleCancelOrder = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (reason?: string) => {
    if (!orderToCancel) return;

    const success = await cancelOrder(orderToCancel.id, reason);
    if (success) {
      await refreshOrders();
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
  };

  const handleCreateOrder = () => {
    console.log("Navigating to order creation page");
    navigate('/pedidos/new');
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  // Import/Export handlers
  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleExport = () => {
    if (showExportMode) {
      setShowExportModal(true);
    } else {
      setShowExportMode(true);
    }
  };

  const handleImportFile = async (file: File) => {
    const success = await importOrders(file);
    if (success) {
      refreshOrders();
      setShowImportModal(false);
    }
  };

  const handleExportOrders = async (ordersToExport: Order[]) => {
    setShowExportModal(true);
  };

  const handleOrderSelect = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleExitExportMode = () => {
    setShowExportMode(false);
    setSelectedOrders([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <OrdersHeader onCreateOrder={handleCreateOrder} />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {!showExportMode && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex-1">
                  <OrdersFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    orderSort={orderSort}
                    setOrderSort={setOrderSort}
                  />
                </div>
                <ImportExportButtons
                  onImport={handleImport}
                  onExport={handleExport}
                />
              </div>
            </>
          )}

          {showExportMode && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Modo de Exportação - Selecione os pedidos</h3>
              <Button variant="outline" onClick={handleExitExportMode}>
                Sair do Modo Exportação
              </Button>
            </div>
          )}
          
          <Card>
            <CardContent className="p-0">
              <OrdersTable
                orders={sortedOrders}
                loading={loading}
                onViewOrder={handleViewOrder}
                onEditOrder={(e, order) => {
                  e.stopPropagation();
                  handleEditOrder(order);
                }}
                onDeleteOrder={handleDeleteOrder}
                onSendToProduction={handleSendToProduction}
                onCancelOrder={handleCancelOrder}
                onOrderClick={handleOrderClick}
                translateStatus={translateStatus}
                showCheckboxes={showExportMode}
                selectedOrders={selectedOrders}
                onOrderSelect={handleOrderSelect}
                hasDirectSaleProduct={hasDirectSaleProduct}
              />
            </CardContent>
          </Card>
        </div>

        {showExportMode && (
          <div className="lg:w-80">
            <OrdersExportFilters
              orders={sortedOrders}
              selectedOrders={selectedOrders}
              onSelectedOrdersChange={setSelectedOrders}
              onExport={handleExportOrders}
              isExporting={isExporting}
            />
          </div>
        )}
      </div>

      <OrderDetailsModal
        isOpen={showOrderModal}
        onClose={handleCloseModal}
        order={selectedOrder}
        onEdit={handleEditOrder}
        translateStatus={translateStatus}
      />

      <OrderImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFile}
        onDownloadTemplate={generateTemplate}
        title="Importar Pedidos"
        isImporting={isImporting}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar Pedidos"
        data={sortedOrders}
        defaultHeaders={orderHeaders}
        defaultFilename="pedidos"
      />

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancel}
        order={orderToCancel}
        loading={cancelLoading}
      />
    </div>
  );
};

export default OrdersPage;
