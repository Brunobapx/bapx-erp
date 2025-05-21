
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('active'); // 'active', 'completed', or 'all'
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch orders from database
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('orders').select('*');
      
      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchString) ||
      order.client_name?.toLowerCase().includes(searchString) ||
      order.product_name?.toLowerCase().includes(searchString) ||
      order.status?.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && order.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !order.completed) {
      return false;
    }

    return matchesSearch;
  });

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
    if (confirm(`Tem certeza que deseja excluir o pedido ${order.id}?`)) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
        
        if (error) throw error;
        
        toast.success('Pedido excluído com sucesso');
        fetchOrders();
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        toast.error('Erro ao excluir pedido');
      }
    }
  };

  const handleApproveOrder = (data) => {
    // Simula a aprovação do pedido
    const updatedOrders = orders.map(order => 
      order.id === data.id 
        ? { ...order, status: 'Aprovado', statusType: 'order' }
        : order
    );
    setOrders(updatedOrders);
    return Promise.resolve();
  };

  const handleNextStage = (data) => {
    // Simula o envio para a próxima etapa
    const updatedOrders = orders.map(order => 
      order.id === data.id 
        ? { 
            ...order, 
            status: data.status, 
            statusType: data.stage,
            quantity: data.quantity || order.quantity
          }
        : order
    );
    setOrders(updatedOrders);
    return Promise.resolve();
  };

  const handleCreateOrder = () => {
    const newOrder = {
      id: `PED-${String(orders.length + 1).padStart(3, '0')}`,
      client_name: '',
      product_name: '',
      quantity: 1,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Novo Pedido',
      statusType: 'order',
      completed: false
    };
    
    setSelectedOrder(newOrder);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      fetchOrders();
      toast.success("Lista de pedidos atualizada");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
        </div>
        <Button onClick={handleCreateOrder}>
          <Package className="mr-2 h-4 w-4" /> Novo Pedido
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Ativos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Concluídos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Produção')}>
                Aguardando Produção
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Em Produção')}>
                Em Produção
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Embalagem')}>
                Aguardando Embalagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Venda')}>
                Aguardando Venda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Financeiro Pendente')}>
                Financeiro Pendente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Rota')}>
                Aguardando Rota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem>Mais antigos</DropdownMenuItem>
              <DropdownMenuItem>Cliente (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Cliente (Z-A)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.client_name}</TableCell>
                  <TableCell>{order.product_name}</TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <span className={`stage-badge badge-${order.statusType || 'order'}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => handleViewOrder(e, order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => handleEditOrder(e, order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                        onClick={(e) => handleDeleteOrder(e, order)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && !loading && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
          {loading && (
            <div className="p-4 text-center">
              Carregando pedidos...
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        stage="order"
        orderData={selectedOrder || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onApprove={handleApproveOrder}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default OrdersPage;
