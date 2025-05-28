
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
import { usePackaging } from '@/hooks/usePackaging';

const PackagingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'packaging' as const,
      message: 'Embalagem #EMB-003 aguardando confirmação há 1 dia',
      time: '1 dia'
    }
  ]);

  const { packagings, loading, updatePackagingStatus, refreshPackagings } = usePackaging();

  // Filter items based on search query and status filter
  const filteredItems = packagings.filter(item => {
    // Text search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch =
      item.packaging_number?.toLowerCase().includes(searchString) ||
      item.product_name?.toLowerCase().includes(searchString) ||
      item.status?.toLowerCase().includes(searchString);
    
    // Status filter
    const isCompleted = ['completed', 'approved'].includes(item.status);
    if (statusFilter === 'active' && isCompleted) {
      return false;
    }
    if (statusFilter === 'completed' && !isCompleted) {
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
    if (confirm(`Tem certeza que deseja excluir a embalagem ${item.packaging_number}?`)) {
      // Implementar exclusão se necessário
      refreshPackagings();
    }
  };

  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApprovePackaging = async (data) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'approved', data.quantityPackaged, data.qualityCheck);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleNextStage = async (data) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'in_progress', data.quantityPackaged);
      if (success) {
        setShowModal(false);
      }
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleCreatePackaging = () => {
    const newPackaging = {
      id: 'new',
      packaging_number: 'NOVO',
      product_name: '',
      quantity_to_package: 1,
      quantity_packaged: 0,
      status: 'pending' as const,
      quality_check: false
    };
    
    setSelectedItem(newPackaging);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    
    if (refresh) {
      refreshPackagings();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
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
                  <TableHead>Embalagem</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd para Embalar</TableHead>
                  <TableHead className="text-center">Qtd Embalada</TableHead>
                  <TableHead>Embalado Por</TableHead>
                  <TableHead>Data Embalagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Qualidade</TableHead>
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
                    <TableCell className="font-medium">{item.packaging_number}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-center">{item.quantity_to_package}</TableCell>
                    <TableCell className="text-center">{item.quantity_packaged || 0}</TableCell>
                    <TableCell>{item.packaged_by || '-'}</TableCell>
                    <TableCell>{formatDate(item.packaged_at)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.quality_check ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.quality_check ? 'Aprovado' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => handleViewItem(e, item)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={(e) => handleEditItem(e, item)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                          onClick={(e) => handleDeleteItem(e, item)}
                          title="Excluir"
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
              Nenhuma embalagem encontrada.
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
          product_name: '', 
          quantity_to_package: 1, 
          customer: ''
        }}
        onApprove={handleApprovePackaging}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default PackagingPage;
