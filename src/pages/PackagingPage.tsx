import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Package, Warehouse, Package2, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StageAlert from '@/components/Alerts/StageAlert';
import { OrderTrackingDebug } from '@/components/Debug/OrderTrackingDebug';
import { usePackagingFlow, PackagingFlowItem } from '@/hooks/usePackagingFlow';
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
import { PackagingSummaryTable } from '@/components/Packaging/PackagingSummaryTable';
import { usePackagingSummary } from '@/hooks/usePackagingSummary';
import { useNavigate } from 'react-router-dom';

const PackagingPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PackagingFlowItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts] = useState([]);
  const navigate = useNavigate();

  const { 
    packagings,
    loading, 
    updatePackagingStatus, 
    refreshPackagings,
    fromStock,
    fromProduction,
    inPackaging,
    ready
  } = usePackagingFlow();

  // Resumo agregado por produto para embalagem
  const packagingSummary = usePackagingSummary(packagings as any);


  const handleItemClick = (item: PackagingFlowItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

const handleApprove = async (data: any) => {
  if (selectedItem) {
    await updatePackagingStatus(
      selectedItem.id, 
      'approved', 
      data.quantityPackaged,
      data.qualityCheck
    );
    setShowModal(false);
    navigate('/vendas');
  }
};

  const handleNextStage = async (data: any) => {
    if (selectedItem) {
      if (selectedItem.status === 'pending') {
        await updatePackagingStatus(selectedItem.id, 'in_progress', data.quantityPackaged);
      }
      setShowModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Package, label: 'Pendente' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Package2, label: 'Em Embalagem' },
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

  const getOriginBadge = (origin: string) => {
    const originMap = {
      'stock': { color: 'bg-blue-100 text-blue-800', icon: Warehouse, label: 'Do Estoque' },
      'production': { color: 'bg-green-100 text-green-800', icon: Package, label: 'Da Produção' },
      'mixed': { color: 'bg-purple-100 text-purple-800', icon: Package2, label: 'Misto' }
    };

    const originInfo = originMap[origin as keyof typeof originMap] || originMap.stock;
    const IconComponent = originInfo.icon;

    return (
      <Badge variant="outline" className={originInfo.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {originInfo.label}
      </Badge>
    );
  };

  const PackagingTable = ({ 
    items, 
    title, 
    emptyMessage 
  }: { 
    items: PackagingFlowItem[], 
    title: string,
    emptyMessage: string 
  }) => {
    const filteredItems = items.filter(item => 
      !searchQuery || 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packaging_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <Package className="w-5 h-5" />
            {title} ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Embalagem</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-center">Qtd Total</TableHead>
                <TableHead className="text-center">Qtd Embalada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Qualidade</TableHead>
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
                  <TableCell>{item.order_number || 'N/A'}</TableCell>
                  <TableCell>{item.client_name || 'N/A'}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{getOriginBadge(item.origin)}</TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <div>{item.quantity_to_package}</div>
                      {item.origin === 'mixed' && (
                        <div className="text-xs text-muted-foreground">
                          E:{item.quantity_from_stock} P:{item.quantity_from_production}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity_packaged}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.quality_check ? 'default' : 'outline'}>
                      {item.quality_check ? 'Aprovado' : 'Pendente'}
                    </Badge>
                  </TableCell>
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
          <h1 className="text-2xl font-bold">Embalagem</h1>
          <p className="text-muted-foreground">Gerencie o fluxo completo de embalagem</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshPackagings()}>
            Atualizar
          </Button>
        </div>
      </div>
      
      <StageAlert alerts={alerts} onDismiss={() => {}} />

      {/* Barra de pesquisa */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar embalagens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Tabs defaultValue="embalagem" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="embalagem">Embalagem</TabsTrigger>
          <TabsTrigger value="resumo">Resumo da Embalagem</TabsTrigger>
        </TabsList>

        <TabsContent value="embalagem" className="space-y-4">
          <PackagingTable 
            items={packagings}
            title="Todas as Embalagens"
            emptyMessage="Nenhum item para embalar no momento."
          />
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          <PackagingSummaryTable summary={packagingSummary} />
        </TabsContent>
      </Tabs>
      
      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stage="packaging"
        orderData={selectedItem || {
          id: 'NOVO', 
          product_name: '', 
          quantity_to_package: 1, 
          customer: ''
        }}
        onApprove={handleApprove}
        onNextStage={handleNextStage}
      />
      
      <OrderTrackingDebug />
    </div>
  );
};

export default PackagingPage;