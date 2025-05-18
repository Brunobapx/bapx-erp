
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, ChevronDown, Search, FileText, Plus, Barcode } from 'lucide-react';
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

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Mock product data
  const products = [
    { 
      id: 1, 
      code: 'PRD-001', 
      name: 'Server Hardware X1',
      sku: '1234567890123',
      ncm: '8471.50.10', 
      price: 5000.00,
      cost: 3500.00,
      stock: 15,
      unit: 'UN',
      category: 'Eletrônicos'
    },
    { 
      id: 2, 
      code: 'PRD-002', 
      name: 'Solar Panel 250W',
      sku: '2345678901234',
      ncm: '8541.40.32', 
      price: 1500.00,
      cost: 900.00,
      stock: 42,
      unit: 'UN',
      category: 'Energia'
    },
    { 
      id: 3, 
      code: 'PRD-003', 
      name: 'Equipamento Médico M3',
      sku: '3456789012345',
      ncm: '9018.19.80', 
      price: 7000.00,
      cost: 4200.00,
      stock: 8,
      unit: 'UN',
      category: 'Médico'
    },
    { 
      id: 4, 
      code: 'PRD-004', 
      name: 'Material de Embalagem',
      sku: '4567890123456',
      ncm: '4819.10.00', 
      price: 100.00,
      cost: 50.00,
      stock: 250,
      unit: 'PC',
      category: 'Embalagens'
    },
  ];

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const searchString = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchString) ||
      product.code.toLowerCase().includes(searchString) ||
      product.sku.toLowerCase().includes(searchString) ||
      product.ncm.toLowerCase().includes(searchString) ||
      product.category.toLowerCase().includes(searchString)
    );
  });

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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de produtos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowModal(true)} className="bg-erp-packaging hover:bg-erp-packaging/90">
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
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{formatCurrency(product.cost)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>
                    <span className="stage-badge badge-packaging">
                      {product.category}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productData={selectedProduct || null}
      />
    </div>
  );
};

export default ProductsPage;
