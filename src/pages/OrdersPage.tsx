
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { OrderModal } from '@/components/Modals/OrderModal';
import { OrdersHeader } from '@/components/Orders/OrdersHeader';
import { OrdersFilters } from '@/components/Orders/OrdersFilters';
import { OrdersTable } from '@/components/Orders/OrdersTable';
import { useOrders } from '@/hooks/useOrders';

const OrdersPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  
  // Custom hook for orders data
  const { orders, loading, deleteOrder, refreshOrders } = useOrders();

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id?.toString().toLowerCase().includes(searchString) ||
      order.client_name?.toLowerCase().includes(searchString) ||
      order.product_name?.toLowerCase().includes(searchString) ||
      order.status?.toLowerCase().includes(searchString) ||
      order.seller?.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && order.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !order.completed) {
      return false;
    }

    return matchesSearch;
  });

  // Event handlers
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleViewOrder = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleEditOrder = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleDeleteOrder = async (e, order) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o pedido ${order.id}?`)) {
      await deleteOrder(order.id);
    }
  };

  const handleCreateOrder = () => {
    setSelectedOrder({ id: 'NOVO' });
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    setSelectedOrder(null);
    
    if (refresh) {
      refreshOrders();
    }
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
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onOrderClick={handleOrderClick}
          />
        </CardContent>
      </Card>
      
      <OrderModal 
        isOpen={showModal}
        onClose={handleModalClose}
        orderData={selectedOrder}
      />
    </div>
  );
};

export default OrdersPage;
