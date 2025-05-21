
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Box, ChevronDown, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
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

const ProductionPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [productionItems, setProductionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'production' as const,
      message: 'Produção #PR-002 aguardando aprovação há 2 dias',
      time: '2 dias'
    },
    {
      id: 'alert-2',
      type: 'production' as const,
      message: 'Material para Produção #PR-005 está em falta',
      time: '4 horas'
    }
  ]);

  // Fetch production items from database
  useEffect(() => {
    fetchProductionItems();
  }, []);

  const fetchProductionItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Em Produção');
      
      if (error) throw error;
      
      // Transform data to match production items structure
      const transformedData = (data || []).map(order => ({
        id: `PR-${order.id.split('-')[1] || '001'}`,
        orderId: order.id,
        product: order.product_name,
        quantity: order.quantity,
        startDate: new Date(order.created_at).toLocaleDateString('pt-BR'),
        deadline: order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString('pt-BR') : 
                 new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        status: order.status,
        progress: Math.floor(Math.random() * 100), // Mock progress
        completed: order.status === 'Concluído'
      }));

      setProductionItems(transformedData);
    } catch (error) {
      console.error('Erro ao carregar produção:', error);
      toast.error('Erro ao carregar itens de produção');
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search query and status filter
  const filteredItems = productionItems.filter(item => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      item.id?.toLowerCase().includes(searchString) ||
      item.orderId?.toLowerCase().includes(searchString) ||
      item.product?.toLowerCase().includes(searchString) ||
      item.status?.toLowerCase().includes(searchString);
    
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
    if (confirm(`Tem certeza que deseja excluir a produção ${item.id}?`)) {
      try {
        // Get the original order ID
        const orderId = item.orderId;
        
        // Update the order status
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'Cancelado',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
          
        if (error) throw error;
        
        toast.success('Produção excluída com sucesso');
        fetchProductionItems();
      } catch (error) {
        console.error('Erro ao excluir produção:', error);
        toast.error('Erro ao excluir produção');
      }
    }
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApproveProduction = (data) => {
    // Update production status logic
    // This would typically update the order in the database
    return Promise.resolve();
  };

  const handleNextStage = (data) => {
    // Move to next stage logic
    // This would typically update the order status in the database
    return Promise.resolve();
  };

  const handleCreateProduction = () => {
    const newProduction = {
      id: `PR-${String(productionItems.length + 1).padStart(3, '0')}`,
      orderId: '',
      product: '',
      quantity: 1,
      startDate: new Date().toLocaleDateString('pt-BR'),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      status: 'Nova Produção',
      progress: 0,
      completed: false
    };
    
    setSelectedItem(newProduction);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      fetchProductionItems();
      toast.success("Lista de produções atualizada");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produção</h1>
          <p className="text-muted-foreground">Gerencie todos os itens em produção.</p>
        </div>
        <Button onClick={handleCreateProduction}>
          <Box className="mr-2 h-4 w-4" /> Nova Produção
        </Button>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produções..."
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
              <DropdownMenuItem onClick={() => setSearchQuery('Em Andamento')}>Em Andamento</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Pendente Aprovação')}>Pendente Aprovação</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Material Pendente')}>Material Pendente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSearchQuery('Concluído')}>Concluído</DropdownMenuItem>
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
              <DropdownMenuItem>Prazo (próximo)</DropdownMenuItem>
              <DropdownMenuItem>Progresso (menor)</DropdownMenuItem>
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
                  <TableHead>Pedido</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
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
                    <TableCell>{item.orderId}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>{item.startDate}</TableCell>
                    <TableCell>{item.deadline}</TableCell>
                    <TableCell>
                      <span className="stage-badge badge-production">
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
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
        stage="production"
        orderData={selectedItem || {
          id: 'NOVO', 
          product: '', 
          quantity: 1, 
          customer: ''
        }}
        onApprove={handleApproveProduction}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default ProductionPage;
