
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ChevronDown, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PackagingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'completed', or 'all'
  const [packagingItems, setPackagingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'packaging' as const,
      message: 'Embalagem #EMB-003 aguardando confirmação há 1 dia',
      time: '1 dia'
    }
  ]);

  // Fetch packaging items from database
  useEffect(() => {
    fetchPackagingItems();
  }, []);

  const fetchPackagingItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['Aguardando Embalagem', 'Embalado']);
      
      if (error) throw error;
      
      // Transform data to match packaging items structure
      const transformedData = (data || []).map(order => ({
        id: `EMB-${order.id.split('-')[1] || '001'}`,
        productionId: `PR-${order.id.split('-')[1] || '001'}`,
        product: order.product_name,
        quantity: order.quantity,
        producedQuantity: order.quantity,
        date: new Date(order.created_at).toLocaleDateString('pt-BR'),
        status: order.status === 'Aguardando Embalagem' ? 'Aguardando Confirmação' : 'Embalado',
        quality: order.status === 'Embalado' ? 'Aprovado' : 'Pendente',
        completed: order.status === 'Embalado',
        orderId: order.id
      }));

      setPackagingItems(transformedData);
    } catch (error) {
      console.error('Erro ao carregar embalagens:', error);
      toast.error('Erro ao carregar itens de embalagem');
    } finally {
      setLoading(false);
    }
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
    if (confirm(`Tem certeza que deseja excluir a embalagem ${item.id}?`)) {
      try {
        // Get the original order ID
        const orderId = item.orderId;
        
        // Update the order status
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'Em Produção', // Move back to production
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
          
        if (error) throw error;
        
        toast.success('Embalagem excluída com sucesso');
        fetchPackagingItems();
      } catch (error) {
        console.error('Erro ao excluir embalagem:', error);
        toast.error('Erro ao excluir embalagem');
      }
    }
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApprovePackaging = (data) => {
    // Update packaging status logic
    // This would typically update the order in the database
    return Promise.resolve();
  };

  const handleNextStage = (data) => {
    // Move to next stage logic
    // This would typically update the order status in the database
    return Promise.resolve();
  };

  const handleCreatePackaging = () => {
    const newPackaging = {
      id: `EMB-${String(packagingItems.length + 1).padStart(3, '0')}`,
      productionId: '',
      product: '',
      quantity: 1,
      producedQuantity: 0,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Nova Embalagem',
      quality: 'Pendente',
      completed: false
    };
    
    setSelectedItem(newPackaging);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      fetchPackagingItems();
      toast.success("Lista de embalagens atualizada");
    }
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
              <DropdownMenuItem onClick={() => setSearchQuery('Embalado')}>Embalado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Confirmação')}>
                Aguardando Confirmação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Em Produção')}>Em Produção</DropdownMenuItem>
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
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                  <TableHead className="text-center">Ações</TableHead>
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
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => handleViewItem(e, item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => handleEditItem(e, item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                          onClick={(e) => handleDeleteItem(e, item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum item encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        stage="packaging"
        orderData={selectedItem || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onApprove={handleApprovePackaging}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default PackagingPage;
