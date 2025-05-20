
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search, Calendar, CreditCard, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
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

const OrdersPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('active'); // 'active', 'completed', or 'all'

  // Fetch orders from Supabase
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      // Transform the data to match our expected format
      return data.map(order => ({
        id: order.id,
        customer: order.client_name,
        product: order.product_name,
        quantity: order.quantity,
        date: new Date(order.created_at).toLocaleDateString('pt-BR'),
        status: order.status || 'Aguardando Produção',
        statusType: getStatusType(order.status),
        completed: isOrderCompleted(order.status),
        deliveryDate: order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString('pt-BR') : '',
        paymentMethod: order.payment_method || '',
        seller: order.seller || ''
      }));
    },
    enabled: !!user?.id,
  });

  // Helper functions to determine status type and completion status
  const getStatusType = (status) => {
    if (!status) return 'production';
    
    status = status.toLowerCase();
    if (status.includes('produção')) return 'production';
    if (status.includes('embalagem')) return 'packaging';
    if (status.includes('venda')) return 'sales';
    if (status.includes('financeiro')) return 'finance';
    if (status.includes('rota')) return 'route';
    return 'production';
  };

  const isOrderCompleted = (status) => {
    if (!status) return false;
    
    status = status.toLowerCase();
    // Define which statuses are considered "completed"
    return status.includes('concluído') || 
           status.includes('entregue') || 
           status.includes('finalizado');
  };

  // Filter orders based on search query and status filter
  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Text search filter
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = 
        order.id.toString().toLowerCase().includes(searchString) ||
        order.customer.toLowerCase().includes(searchString) ||
        order.product.toLowerCase().includes(searchString) ||
        order.status.toLowerCase().includes(searchString) ||
        (order.seller && order.seller.toLowerCase().includes(searchString));
      
      // Status filter
      if (statusFilter === 'active' && order.completed) {
        return false;
      }
      if (statusFilter === 'completed' && !order.completed) {
        return false;
      }

      return matchesSearch;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Refresh orders after modal closes (in case of updates)
  const handleModalClose = () => {
    setShowModal(false);
    refetch();
  };

  // Lista de clientes para o modal
  const [clients, setClients] = React.useState([]);
  
  // Lista de produtos para o modal
  const [products, setProducts] = React.useState([]);

  // Load mock clients and products for now
  // In a real app, these would be fetched from Supabase
  useEffect(() => {
    // Mock clients
    setClients([
      { id: 1, name: 'Tech Solutions Ltda', value: '1', label: 'Tech Solutions Ltda' },
      { id: 2, name: 'Green Energy Inc', value: '2', label: 'Green Energy Inc' },
      { id: 3, name: 'City Hospital', value: '3', label: 'City Hospital' },
      { id: 4, name: 'Global Foods SA', value: '4', label: 'Global Foods SA' },
      { id: 5, name: 'Modern Office', value: '5', label: 'Modern Office' },
      { id: 6, name: 'Local Retailer', value: '6', label: 'Local Retailer' },
      { id: 7, name: 'Education Center', value: '7', label: 'Education Center' },
    ]);
    
    // Mock products
    setProducts([
      { id: 1, name: 'Server Hardware X1', value: '1', label: 'Server Hardware X1' },
      { id: 2, name: 'Solar Panel 250W', value: '2', label: 'Solar Panel 250W' },
      { id: 3, name: 'Equipamento Médico M3', value: '3', label: 'Equipamento Médico M3' },
      { id: 4, name: 'Material de Embalagem', value: '4', label: 'Material de Embalagem' },
      { id: 5, name: 'Desk Solutions', value: '5', label: 'Desk Solutions' },
      { id: 6, name: 'Display Units', value: '6', label: 'Display Units' },
      { id: 7, name: 'Interactive Boards', value: '7', label: 'Interactive Boards' },
    ]);
  }, []);

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Carregando pedidos...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => handleOrderClick(order)}
                  >
                    <TableCell className="font-medium">{order.id.toString().substring(0, 8)}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.deliveryDate}</TableCell>
                    <TableCell>{order.seller}</TableCell>
                    <TableCell>
                      <span className={`stage-badge badge-${order.statusType}`}>
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
          customer: '',
          deliveryDate: null,
          paymentMethod: '',
          seller: ''
        }}
        clientsData={clients}
        productsData={products}
      />
    </div>
  );
};

export default OrdersPage;
