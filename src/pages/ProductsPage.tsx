
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, ChevronDown, Search, FileText, Plus, Barcode, Factory, Loader2 } from 'lucide-react';
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
import { ProductModal } from '@/components/Modals/ProductModal';
import { useProducts } from '@/hooks/useProducts';

const ProductsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { 
    products: filteredProducts, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshProducts 
  } = useProducts();

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    setSelectedProduct(null);
    
    if (refresh) {
      refreshProducts();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de produtos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setSelectedProduct(null); setShowModal(true); }} className="bg-erp-packaging hover:bg-erp-packaging/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Catálogo Fiscal
          </Button>
        </div>
      </div>
      
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Categoria <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todas</DropdownMenuItem>
              <DropdownMenuItem>Eletrônicos</DropdownMenuItem>
              <DropdownMenuItem>Energia</DropdownMenuItem>
              <DropdownMenuItem>Médico</DropdownMenuItem>
              <DropdownMenuItem>Embalagens</DropdownMenuItem>
              <DropdownMenuItem>Insumos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Nome (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Nome (Z-A)</DropdownMenuItem>
              <DropdownMenuItem>Preço (Maior)</DropdownMenuItem>
              <DropdownMenuItem>Preço (Menor)</DropdownMenuItem>
              <DropdownMenuItem>Estoque (Maior)</DropdownMenuItem>
              <DropdownMenuItem>Estoque (Menor)</DropdownMenuItem>
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
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              Erro ao carregar produtos: {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>NCM</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Un.</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fabricado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => handleProductClick(product)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      {product.code}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.ncm}</TableCell>
                    <TableCell>{product.price ? formatCurrency(product.price) : '-'}</TableCell>
                    <TableCell>{product.cost ? formatCurrency(product.cost) : '-'}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <span className="stage-badge badge-packaging">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.is_manufactured && (
                        <div className="flex justify-center">
                          <Factory className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ProductModal
        isOpen={showModal}
        onClose={handleModalClose}
        productData={selectedProduct || null}
      />
    </div>
  );
};

export default ProductsPage;
