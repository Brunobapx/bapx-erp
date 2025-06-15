import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, ChevronDown, Search, FileText, Plus, Barcode, Factory, Loader2, Package } from 'lucide-react';
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
import { CategoriesTab } from '@/components/Products/CategoriesTab';
import { MarkupTab } from '@/components/Products/MarkupTab';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from "@/integrations/supabase/client";

const ProductsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState<any[]>([]);
  const { 
    products: filteredProducts, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshProducts 
  } = useProducts();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return;
      }

      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

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
          <p className="text-muted-foreground">Cadastro e gerenciamento de produtos e categorias.</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="markup" className="flex items-center gap-2">
            <span className="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7V17M4 7V17M7 10V14M17 10V14M9 12V12.01M15 12V12.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            Markup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                  {categories.map(category => (
                    <DropdownMenuItem key={category.id}>
                      {category.name}
                    </DropdownMenuItem>
                  ))}
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
                          {product.is_direct_sale && (
                            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded border border-green-400">
                              Venda Direta
                            </span>
                          )}
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
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="markup">
          <MarkupTab />
        </TabsContent>
      </Tabs>
      
      <ProductModal
        isOpen={showModal}
        onClose={handleModalClose}
        productData={selectedProduct || null}
      />
    </div>
  );
};

export default ProductsPage;
