import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCart } from "./hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem, getItemQuantity } = useCart();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("public-catalog", {
        body: { id },
      });

      if (error) {
        console.error("Error loading product:", error);
        navigate("/loja");
        return;
      }

      if (data?.product) {
        setProduct(data.product);
      } else {
        navigate("/loja");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      navigate("/loja");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        stock: product.stock,
      }, quantity);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const currentCartQuantity = product ? getItemQuantity(product.id) : 0;
  const maxQuantity = product ? Math.max(0, product.stock - currentCartQuantity) : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/loja")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos produtos
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded w-24" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Produto não encontrado
        </h3>
        <Button onClick={() => navigate("/loja")}>
          Voltar aos produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/loja")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar aos produtos
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
          <div className="text-8xl text-primary/60">📦</div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>
            <Badge variant="secondary" className="mb-4">
              {product.category}
            </Badge>
          </div>

          <div className="text-3xl font-bold text-primary">
            {formatCurrency(product.price)}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Stock Info */}
          <div className="flex items-center gap-2">
            <Badge variant={product.stock > 0 ? "secondary" : "outline"}>
              {product.stock > 0 ? `${product.stock} em estoque` : "Sob consulta"}
            </Badge>
            {currentCartQuantity > 0 && (
              <Badge variant="outline">
                {currentCartQuantity} no carrinho
              </Badge>
            )}
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const clampedValue = Math.min(Math.max(1, value), maxQuantity);
                        setQuantity(clampedValue);
                      }}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Máximo disponível: {maxQuantity}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || maxQuantity === 0}
            variant={product.stock === 0 ? "outline" : "default"}
            size="lg"
            className="w-full"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {product.stock === 0 
              ? "Consultar Disponibilidade" 
              : maxQuantity === 0 
                ? "Quantidade Máxima no Carrinho"
                : "Adicionar ao Carrinho"
            }
          </Button>

          {/* Total Price */}
          {quantity > 1 && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="text-lg font-semibold">
                {formatCurrency(product.price * quantity)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}