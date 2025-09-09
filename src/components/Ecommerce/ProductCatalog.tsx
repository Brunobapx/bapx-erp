import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Filter } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCart } from "./hooks/useCart";
import { useCompanyStore } from "@/contexts/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export function ProductCatalog() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { addItem } = useCart();
  const { company } = useCompanyStore();

  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "";

  const loadProducts = useCallback(async () => {
    if (!company?.id) {
      console.log("ProductCatalog: No company ID, skipping product load");
      return;
    }
    
    console.log("ProductCatalog: Loading products for company:", company.id, {
      searchQuery,
      selectedCategory: selectedCategory !== 'all' ? selectedCategory : null
    });
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('public-catalog', {
        body: {
          company_id: company.id,
          search: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : null
        }
      });

      console.log("ProductCatalog: Products response:", { 
        data, 
        error,
        productsCount: data?.products?.length,
        categoriesCount: data?.categories?.length
      });

      if (error) {
        console.error("ProductCatalog: Error loading products:", error);
        return;
      }

      setProducts(data?.products || []);
      setCategories(data?.categories || []);
    } catch (error) {
      console.error("ProductCatalog: Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }, [company?.id, searchQuery, selectedCategory]);

  useEffect(() => {
    if (company) {
      loadProducts();
    }
  }, [company, loadProducts]);

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      stock: product.stock,
    }, 1);
  };

  // Debug logs para verificar estado
  console.log("ProductCatalog Debug:", { 
    company: !!company, 
    companyId: company?.id,
    loading,
    products: products.length,
    categories: categories.length 
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-foreground">Carregando produtos...</h2>
          <p className="text-muted-foreground">Preparando catálogo para você</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Preparando loja...
        </h3>
        <p className="text-muted-foreground">
          Carregando informações da empresa
        </p>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-muted-foreground">
          Esta loja ainda não possui produtos cadastrados ou disponíveis.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Empresa: {company.name} (ID: {company.id})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {searchQuery ? `Resultados para "${searchQuery}"` : "Produtos"}
          </h1>
          <p className="text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou fazer uma nova busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <Link to={`/loja/produto/${product.id}`}>
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center">
                  <div className="text-4xl text-primary/60">📦</div>
                </div>
              </Link>
              
              <CardContent className="p-4">
                <Link to={`/loja/produto/${product.id}`}>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge variant={product.stock > 0 ? "secondary" : "outline"}>
                    {product.stock > 0 ? `${product.stock} em estoque` : "Sob consulta"}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  variant={product.stock === 0 ? "outline" : "default"}
                  className="w-full"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock === 0 ? "Consultar Disponibilidade" : "Adicionar ao Carrinho"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}