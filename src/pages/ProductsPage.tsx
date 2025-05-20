
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, ChevronDown, Search, FileText, Plus, Barcode, Factory } from 'lucide-react';
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [sortOrder, setSortOrder] = useState('Nome (A-Z)');

  // Fetch products from Supabase
  const { 
    data: products = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Apply filters and sorting to products
  const filteredProducts = products
    .filter(product => {
      // Apply search filter
      const searchString = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (product.name && product.name.toLowerCase().includes(searchString)) ||
        (product.code && product.code.toLowerCase().includes(searchString)) ||
        (product.sku && product.sku.toLowerCase().includes(searchString)) ||
        (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
        (product.category && product.category.toLowerCase().includes(searchString));
      
      // Apply category filter
      const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortOrder) {
        case 'Nome (A-Z)':
          return (a.name || '').localeCompare(b.name || '');
        case 'Nome (Z-A)':
          return (b.name || '').localeCompare(a.name || '');
        case 'Preço (Maior)':
          return (b.price || 0) - (a.price || 0);
        case 'Preço (Menor)':
          return (a.price || 0) - (b.price || 0);
        case 'Estoque (Maior)':
          return (b.stock || 0) - (a.stock || 0);
        case 'Estoque (Menor)':
          return (a.stock || 0) - (b.stock || 0);
        default:
          return 0;
      }
    });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleModalClose = (refreshNeeded = false) => {
    setShowModal(false);
    setSelectedProduct(null);
    
    // Refresh products if a product was added or updated
    if (refreshNeeded) {
      refetch();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Get unique categories for filter dropdown
  const categories = ['Todas', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de produtos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setSelectedProduct(null); setShowModal(true); }} 
            className="bg-erp-packaging hover:bg-erp-packaging/90"
          >
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
                {categoryFilter} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuItem 
                  key={category} 
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortOrder('Nome (A-Z)')}>Nome (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('Nome (Z-A)')}>Nome (Z-A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('Preço (Maior)')}>Preço (Maior)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('Preço (Menor)')}>Preço (Menor)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('Estoque (Maior)')}>Estoque (Maior)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('Estoque (Menor)')}>Estoque (Menor)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 text-center">Carregando produtos...</div>
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
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
                        {product.category && (
                          <span className="stage-badge badge-packaging">
                            {product.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.is_manufactured && (
                          <div className="flex justify-center">
                            <Factory className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <ProductModal
        isOpen={showModal}
        onClose={handleModalClose}
        productData={selectedProduct}
      />
    </div>
  );
};

export default ProductsPage;
