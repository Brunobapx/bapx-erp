import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Box, Package2, PlayCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StageAlert from '@/components/Alerts/StageAlert';
import { OrderTrackingDebug } from '@/components/Debug/OrderTrackingDebug';
import TestProcessOrders from '@/components/Debug/TestProcessOrders';
import { useProductionFlow, ProductionFlowItem, InternalProductionItem } from '@/hooks/useProductionFlow';
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { ProductionSummaryTable } from '@/components/Production/ProductionSummaryTable';
import { useProductionSummary } from '@/hooks/useProductionSummary';

const ProductionPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductionFlowItem | InternalProductionItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts] = useState([]);

  const { 
    productions, 
    internalProductions, 
    loading, 
    updateProductionStatus, 
    refreshProductions 
  } = useProductionFlow();

  // Resumo agregado por produto
  const productionSummary = useProductionSummary(productions);

  // Filtros para as diferentes abas (mantidos para possíveis usos futuros)
  const pendingProductions = productions.filter(p => p.status === 'pending');
  const inProgressProductions = productions.filter(p => p.status === 'in_progress');
  const completedProductions = productions.filter(p => p.status === 'completed' || p.status === 'approved');

  const handleItemClick = (item: ProductionFlowItem | InternalProductionItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleApprove = async (data: any) => {
    if (selectedItem) {
      await updateProductionStatus(selectedItem.id, 'approved', data.quantity);
      setShowModal(false);
    }
  };

  const handleNextStage = async (data: any) => {
    if (selectedItem) {
      if (selectedItem.status === 'pending') {
        await updateProductionStatus(selectedItem.id, 'in_progress');
      } else if (selectedItem.status === 'in_progress') {
        await updateProductionStatus(selectedItem.id, 'completed', data.quantity);
      }
      setShowModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: PlayCircle, label: 'Pendente' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Package2, label: 'Em Produção' },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Concluída' },
      'approved': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Aprovada' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const IconComponent = statusInfo.icon;

    return (
      <Badge className={statusInfo.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const ProductionTable = ({ 
    items, 
    title, 
    emptyMessage 
  }: { 
    items: ProductionFlowItem[], 
    title: string,
    emptyMessage: string 
  }) => {
    const filteredItems = items.filter(item => 
      !searchQuery || 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.production_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">{emptyMessage}</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            {title} ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produção</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd Solicitada</TableHead>
                <TableHead className="text-center">Qtd Produzida</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleItemClick(item)}
                >
                  <TableCell className="font-medium">{item.production_number}</TableCell>
                  <TableCell>{item.order_number}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-center">{item.quantity_requested}</TableCell>
                  <TableCell className="text-center">{item.quantity_produced}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const InternalProductionTable = ({ items }: { items: InternalProductionItem[] }) => {
    const filteredItems = items.filter(item => 
      !searchQuery || 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.production_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              Nenhuma produção interna encontrada
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Produção Interna ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produção</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd Solicitada</TableHead>
                <TableHead className="text-center">Qtd Produzida</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleItemClick(item)}
                >
                  <TableCell className="font-medium">{item.production_number}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-center">{item.quantity_requested}</TableCell>
                  <TableCell className="text-center">{item.quantity_produced}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produção</h1>
          <p className="text-muted-foreground">Gerencie o fluxo completo de produção</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshProductions()}>
            Atualizar
          </Button>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={() => {}} />

      {/* Barra de pesquisa */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produções..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Tabs defaultValue="producao" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="resumo">Resumo da Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="producao" className="space-y-4">
          <ProductionTable 
            items={productions as any}
            title="Produções"
            emptyMessage="Nenhuma produção encontrada. Use o botão 'Processar Pendentes' na página de pedidos para enviar itens para produção."
          />
          <InternalProductionTable items={internalProductions} />
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          <ProductionSummaryTable productionSummary={productionSummary} loading={loading} />
        </TabsContent>
      </Tabs>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stage="production"
        orderData={selectedItem || {
          id: 'NOVO', 
          product_name: '', 
          quantity_requested: 1, 
          customer: ''
        }}
        onApprove={handleApprove}
        onNextStage={handleNextStage}
      />
      
      <TestProcessOrders />
      <OrderTrackingDebug />
    </div>
  );
};

export default ProductionPage;