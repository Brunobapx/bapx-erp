import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function OrderSuccessPage() {
  const { companyCode, orderId } = useParams<{ companyCode: string; orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      
      try {
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (name, price)
            )
          `)
          .eq('id', orderId)
          .single();
        
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Carregando informações do pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedido Realizado!</h1>
          <p className="text-muted-foreground mt-2">
            Seu pedido foi recebido e está sendo processado.
          </p>
        </div>
      </div>

      {/* Order Details */}
      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedido #{order.order_number}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="font-semibold mb-2">Dados do Cliente</h3>
              <p className="text-sm text-muted-foreground">{order.client_name}</p>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Itens do Pedido</h3>
              <div className="space-y-2">
                {order.order_items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm py-2 border-b border-border/50">
                    <span>
                      {item.quantity}x {item.product_name}
                    </span>
                    <span>R$ {(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>R$ {order.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
            <div>
              <p className="font-medium">Confirmação do Pedido</p>
              <p className="text-sm text-muted-foreground">
                Você receberá um e-mail com a confirmação e detalhes do seu pedido.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
            <div>
              <p className="font-medium">Processamento</p>
              <p className="text-sm text-muted-foreground">
                Seu pedido será processado e preparado para envio.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
            <div>
              <p className="font-medium">Envio</p>
              <p className="text-sm text-muted-foreground">
                Você receberá o código de rastreamento quando o pedido for enviado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link to={`/loja/${companyCode}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar Comprando
          </Link>
        </Button>
      </div>
    </div>
  );
}