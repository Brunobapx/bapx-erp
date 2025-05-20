
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search } from 'lucide-react';
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
import StageAlert from '@/components/Alerts/StageAlert';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PackagingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [packagingItems, setPackagingItems] = useState([]);
  const { toast } = useToast();

  // Fetch packaging items (orders waiting for packaging)
  useEffect(() => {
    fetchPackagingItems();
    checkForAlerts();
  }, []);

  const fetchPackagingItems = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['Aguardando Embalagem', 'Embalado']);
      
      if (error) throw error;
      
      const formattedItems = data.map(order => ({
        id: `EMB-${order.id.substring(0, 5)}`,
        originalId: order.id,
        productionId: `PR-${order.id.substring(0, 5)}`,
        product: order.product_name,
        quantity: order.quantity,
        producedQuantity: order.status === 'Embalado' ? order.quantity : 0,
        date: new Date(order.created_at).toLocaleDateString(),
        status: order.status,
        quality: order.status === 'Embalado' ? 'Aprovado' : 'Pendente',
        completed: order.status === 'Embalado'
      }));
      
      setPackagingItems(formattedItems);
    } catch (error) {
      console.error('Error fetching packaging items:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Não foi possível carregar os itens para embalagem.",
        variant: "destructive",
      });
    }
  };

  const checkForAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Aguardando Embalagem')
        .order('created_at', { ascending: true })
        .limit(3);
      
      if (error) throw error;
      
      const alertItems = data.map((item, index) => ({
        id: `alert-packaging-${index}`,
        type: 'packaging' as const,
        message: `Embalagem #EMB-${item.id.substring(0, 5)} aguardando confirmação`,
        time: getTimeAgo(new Date(item.created_at))
      }));
      
      setAlerts(alertItems);
    } catch (error) {
      console.error('Error checking for alerts:', error);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  };

  // Filter items based on search query and status filter
  const filteredItems = packagingItems.filter(item => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(searchString) ||
      item.productionId.toLowerCase().includes(searchString) ||
      item.product.toLowerCase().includes(searchString) ||
      item.status.toLowerCase().includes(searchString);
    
    // Status filter
    if (statusFilter === 'active' && item.completed) {
      return false;
    }
    if (statusFilter === 'completed' && !item.completed) {
      return false;
    }

    return matchesSearch;
  });

  const handleItemClick = (item) => {
    // Convert packaging item format to order format for the modal
    const orderData = {
      id: item.originalId,
      product: item.product,
      quantity: item.quantity,
      producedQuantity: item.producedQuantity,
      status: item.status
    };
    
    setSelectedItem(orderData);
    setShowModal(true);
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handlePackagingUpdate = async (formData) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'Aguardando Venda'
        })
        .eq('id', formData.id);
      
      if (error) throw error;
      
      toast({
        title: "Embalagem confirmada",
        description: `Produto enviado para venda.`,
      });
      
      // Refresh packaging items and alerts
      fetchPackagingItems();
      checkForAlerts();
      
    } catch (error) {
      console.error('Error updating packaging status:', error);
      toast({
        title: "Erro ao confirmar embalagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Embalagem</h1>
          <p className="text-muted-foreground">Gerencie todos os produtos para embalagem.</p>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar embalagens..."
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
              <DropdownMenuItem>Embalado</DropdownMenuItem>
              <DropdownMenuItem>Aguardando Confirmação</DropdownMenuItem>
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
              <DropdownMenuItem>Produto (A-Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Produção</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd Pedida</TableHead>
                <TableHead className="text-center">Qtd Produzida</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qualidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleItemClick(item)}
                >
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.productionId}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.producedQuantity}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-packaging">
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`stage-badge ${item.quality === 'Aprovado' ? 'badge-sales' : 'badge-route'}`}>
                      {item.quality}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum item encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stage="packaging"
        orderData={selectedItem || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onSave={handlePackagingUpdate}
      />
    </div>
  );
};

export default PackagingPage;
