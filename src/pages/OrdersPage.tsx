
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { OrdersHeader } from '@/components/Orders/OrdersHeader';
import { OrdersFilters } from '@/components/Orders/OrdersFilters';
import { OrdersTable } from '@/components/Orders/OrdersTable';
import { useOrders, Order } from '@/hooks/useOrders';
import { OrderDetailsModal } from '@/components/Orders/OrderDetailsModal';

const OrdersPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Custom hook for orders data
  const { orders, loading, deleteOrder, sendToProduction, refreshOrders, isOrderCompleted, getFirstOrderItem, translateStatus } = useOrders();

  // Check if we need to refresh orders (when returning from form)
  useEffect(() => {
    if (location.state && location.state.refresh) {
      console.log("Refreshing orders after form submission");
      refreshOrders();
      // Clear the state to avoid unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshOrders]);

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const firstItem = getFirstOrderItem(order);
    const matchesSearch = 
      order.id?.toString().toLowerCase().includes(searchString) ||
      order.client_name?.toLowerCase().includes(searchString) ||
      firstItem?.product_name?.toLowerCase().includes(searchString) ||
      translateStatus(order.status)?.toLowerCase().includes(searchString) ||
      order.seller?.toLowerCase().includes(searchString);
    
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

  const handleCreateOrder = () => {
    console.log("Navigating to order creation page");
    navigate('/pedidos/new');
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <OrdersHeader onCreateOrder={handleCreateOrder} />
      
      <OrdersFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      
      <Card>
        <CardContent className="p-0">
          <OrdersTable
            orders={filteredOrders}
            loading={loading}
            onViewOrder={handleViewOrder}
            onEditOrder={(e, order) => {
              e.stopPropagation();
              handleEditOrder(order);
            }}
            onDeleteOrder={handleDeleteOrder}
            onSendToProduction={handleSendToProduction}
            onOrderClick={handleOrderClick}
            translateStatus={translateStatus}
          />
        </CardContent>
      </Card>

      <OrderDetailsModal
        isOpen={showOrderModal}
        onClose={handleCloseModal}
        order={selectedOrder}
        onEdit={handleEditOrder}
        translateStatus={translateStatus}
      />
    </div>
  );
};

export default OrdersPage;
