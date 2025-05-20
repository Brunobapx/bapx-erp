import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search, Calendar, CreditCard, User } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const { toast } = useToast();

  // Fetch orders and products on component mount
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*');
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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
    if (statusFilter === 'active' && order.status === 'completed') {
      return false;
    }
    if (statusFilter === 'completed' && order.status !== 'completed') {
      return false;
    }

    return matchesSearch;
  });

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Lista de clientes para o modal
  const clients = [
    { id: 1, name: 'Tech Solutions Ltda', value: '1', label: 'Tech Solutions Ltda' },
    { id: 2, name: 'Green Energy Inc', value: '2', label: 'Green Energy Inc' },
    { id: 3, name: 'City Hospital', value: '3', label: 'City Hospital' },
    { id: 4, name: 'Global Foods SA', value: '4', label: 'Global Foods SA' },
    { id: 5, name: 'Modern Office', value: '5', label: 'Modern Office' },
    { id: 6, name: 'Local Retailer', value: '6', label: 'Local Retailer' },
    { id: 7, name: 'Education Center', value: '7', label: 'Education Center' },
  ];
  
  // Lista de produtos para o modal
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    value: product.id,
    label: product.name,
    stock: product.stock
  }));

  const handleOrderSave = async (orderData) => {
    try {
      // If order has an ID, it's an update
      if (orderData.id && orderData.id !== 'NOVO') {
        const { error } = await supabase
          .from('orders')
          .update({
            client_name: orderData.customer,
            product_name: orderData.product,
            quantity: orderData.quantity,
            delivery_deadline: orderData.deliveryDate,
            payment_method: orderData.paymentMethod,
            seller: orderData.seller,
            status: orderData.status || 'Aguardando Produção'
          })
          .eq('id', orderData.id);

        if (error) throw error;
        
        toast({
          title: "Pedido atualizado",
          description: `Pedido ${orderData.id} foi atualizado com sucesso.`,
        });
      } else {
        // Check if product is in stock
        const selectedProduct = products.find(p => p.name === orderData.product);
        const hasStock = selectedProduct && selectedProduct.stock >= orderData.quantity;
        
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        
        // Find client ID and ensure it's a string
        const clientInfo = clients.find(c => c.name === orderData.customer);
        const clientId = clientInfo ? String(clientInfo.id) : '1';
        
        // Create new order
        const { data, error } = await supabase
          .from('orders')
          .insert({
            client_id: clientId,
            client_name: orderData.customer,
            product_id: selectedProduct?.id || '1',
            product_name: orderData.product,
            quantity: orderData.quantity,
            delivery_deadline: orderData.deliveryDate,
            payment_method: orderData.paymentMethod,
            seller: orderData.seller,
            status: hasStock ? 'Aguardando Venda' : 'Aguardando Produção',
            user_id: user.id
          })
          .select();

        if (error) throw error;
        
        // Display appropriate message based on stock availability
        if (!hasStock) {
          toast({
            title: "Pedido criado e enviado para produção",
            description: `Produto não disponível em estoque. Pedido enviado para produção.`,
          });
        } else {
          toast({
            title: "Pedido criado",
            description: `Pedido foi criado com sucesso e está disponível para venda.`,
          });
        }
      }
      
      // Refresh orders list
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Erro ao salvar pedido",
        description: error.message || "Ocorreu um erro ao salvar o pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos do sistema.</p>
        </div>
        <Button onClick={() => { setSelectedOrder(null); setShowModal(true); }}>
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
              <DropdownMenuItem>Aguardando Produção</DropdownMenuItem>
              <DropdownMenuItem>Em Produção</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Embalagem</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Venda</DropdownMenuItem>
              <DropdownMenuItem>Financeiro Pendente</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Rota</DropdownMenuItem>
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
                <TableHead>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" /> Entrega
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" /> Vendedor
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{order.seller}</TableCell>
                  <TableCell>
                    <span className={`stage-badge badge-${getStatusType(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum pedido encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stage="order"
        orderData={selectedOrder || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: '',
          deliveryDate: null,
          paymentMethod: '',
          seller: ''
        }}
        clientsData={clients}
        productsData={formattedProducts}
        onSave={handleOrderSave}
      />
    </div>
  );
};

// Helper function to determine the status type for badge styling
const getStatusType = (status) => {
  switch (status) {
    case 'Aguardando Produção': return 'production';
    case 'Em Produção': return 'production';
    case 'Aguardando Embalagem': return 'packaging';
    case 'Aguardando Venda': return 'sales';
    case 'Venda Confirmada': return 'sales';
    case 'Financeiro Pendente': return 'finance';
    case 'Aguardando Rota': return 'route';
    case 'Rota Definida': return 'route';
    case 'Completed': return 'sales';
    default: return 'order';
  }
};

export default OrdersPage;
