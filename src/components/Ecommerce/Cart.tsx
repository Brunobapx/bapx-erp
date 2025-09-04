import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCart } from "./hooks/useCart";

export function Cart() {
  const navigate = useNavigate();
  const { companyCode } = useParams<{ companyCode: string }>();
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate(`/loja/${companyCode}/checkout`);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Seu carrinho está vazio
        </h3>
        <p className="text-muted-foreground mb-6">
          Adicione alguns produtos ao seu carrinho para continuar
        </p>
        <Link to={`/loja/${companyCode}`}>
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Ver Produtos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Carrinho de Compras</h1>
          <p className="text-muted-foreground">
            {getTotalItems()} item{getTotalItems() !== 1 ? "s" : ""} no carrinho
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" onClick={clearCart}>
            Limpar Carrinho
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product_id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl text-primary/60">📦</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatCurrency(item.unit_price)} cada
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const clampedValue = Math.min(Math.max(1, value), item.stock);
                          handleQuantityChange(item.product_id, clampedValue);
                        }}
                        className="w-16 h-8 text-center"
                      />
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm text-muted-foreground ml-2">
                        de {item.stock} disponíveis
                      </span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="text-right">
                    <div className="font-semibold text-lg mb-3">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.product_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({getTotalItems()} itens)</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete</span>
                  <span className="text-muted-foreground">A calcular</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(getTotalPrice())}</span>
              </div>

              <Button onClick={handleCheckout} className="w-full" size="lg">
                Finalizar Compra
              </Button>

              <Link to={`/loja/${companyCode}`}>
                <Button variant="outline" className="w-full">
                  Continuar Comprando
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}