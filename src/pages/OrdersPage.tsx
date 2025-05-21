
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { OrdersHeader } from '@/components/Orders/OrdersHeader';
import { OrdersFilters } from '@/components/Orders/OrdersFilters';
import { OrdersTable } from '@/components/Orders/OrdersTable';
import { useOrders } from '@/hooks/useOrders';
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const navigate = useNavigate();
  const location = useLocation();
  
  // Custom hook for orders data
  const { orders, loading, deleteOrder, refreshOrders } = useOrders();

  // Check if we need to refresh orders (when returning from form)
  useEffect(() => {
    if (location.state && location.state.refresh) {
      refreshOrders();
      // Clear the state to avoid unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refreshOrders]);

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
    navigate(`/pedidos/${order.id}`);
  };

  const handleViewOrder = (e, order) => {
    e.stopPropagation();
    navigate(`/pedidos/${order.id}`);
  };

  const handleEditOrder = (e, order) => {
    e.stopPropagation();
    navigate(`/pedidos/${order.id}`);
  };

  const handleDeleteOrder = async (e, order) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o pedido ${order.id}?`)) {
      await deleteOrder(order.id);
    }
  };

  const handleCreateOrder = () => {
    navigate('/pedidos/new');
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
    </div>
  );
};

export default OrdersPage;
