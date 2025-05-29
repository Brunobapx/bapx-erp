
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Plus, Minus, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockMovementModal } from '@/components/Stock/StockMovementModal';
import { useProducts } from '@/hooks/useProducts';

const StockPage = () => {
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [stockFilter, setStockFilter] = useState('all');
  const { 
    products, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshProducts 
  } = useProducts();

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { status: 'out', color: 'destructive', label: 'Sem estoque' };
    if (stock <= 5) return { status: 'low', color: 'secondary', label: 'Estoque baixo' };
    if (stock <= 20) return { status: 'medium', color: 'default', label: 'Estoque médio' };
    return { status: 'high', color: 'default', label: 'Estoque alto' };
  };

  const filteredProducts = products.filter(product => {
    const stockStatus = getStockStatus(product.stock || 0);
    
    switch (stockFilter) {
      case 'out':
        return stockStatus.status === 'out';
      case 'low':
        return stockStatus.status === 'low';
      case 'medium':
        return stockStatus.status === 'medium';
      case 'high':
        return stockStatus.status === 'high';
      default:
        return true;
    }
  });

  const stockStats = {
    total: products.length,
    outOfStock: products.filter(p => (p.stock || 0) <= 0).length,
    lowStock: products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length,
    totalValue: products.reduce((acc, p) => acc + ((p.cost || 0) * (p.stock || 0)), 0)
  };

  const handleStockMovement = (product: any, type: 'in' | 'out') => {
    setSelectedProduct(product);
    setMovementType(type);
    setShowMovementModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowMovementModal(false);
    setSelectedProduct(null);
    
    if (refresh) {
      refreshProducts();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie o estoque dos seus produtos.</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockStats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stockStats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stockStats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              <SelectItem value="out">Sem estoque</SelectItem>
              <SelectItem value="low">Estoque baixo</SelectItem>
              <SelectItem value="medium">Estoque médio</SelectItem>
              <SelectItem value="high">Estoque alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock || 0);
                const totalValue = (product.cost || 0) * (product.stock || 0);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {product.stock || 0} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(product.cost || 0)}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(totalValue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockMovement(product, 'in')}
                          title="Entrada de estoque"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockMovement(product, 'out')}
                          title="Saída de estoque"
                          disabled={(product.stock || 0) <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      <StockMovementModal
        isOpen={showMovementModal}
        onClose={handleModalClose}
        product={selectedProduct}
        movementType={movementType}
      />
    </div>
  );
};

export default StockPage;
