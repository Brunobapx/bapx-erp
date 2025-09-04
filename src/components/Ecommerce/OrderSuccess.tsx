import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, CreditCard, Truck, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  client_name: string;
  payment_method: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      // Load order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) {
        console.error("Error loading order:", orderError);
        return;
      }

      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, total_price")
        .eq("order_id", id);

      if (itemsError) {
        console.error("Error loading order items:", itemsError);
        return;
      }

      setOrderItems(itemsData || []);

    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { label: "Aguardando Pagamento", color: "secondary", icon: CreditCard },
      in_production: { label: "Em Produção", color: "default", icon: Package },
      in_packaging: { label: "Em Embalagem", color: "default", icon: Package },
      released_for_sale: { label: "Liberado para Venda", color: "default", icon: Package },
      sale_confirmed: { label: "Venda Confirmada", color: "default", icon: CheckCircle },
      in_delivery: { label: "Em Entrega", color: "default", icon: Truck },
      delivered: { label: "Entregue", color: "default", icon: CheckCircle }
    };

    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Pedido não encontrado
        </h3>
        <Link to="/loja">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à loja
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Success Message */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pedido Realizado com Sucesso!
        </h1>
        <p className="text-muted-foreground">
          Seu pedido foi recebido e está sendo processado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Número do Pedido:</span>
                <p className="font-semibold">#{order.order_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data do Pedido:</span>
                <p className="font-semibold">
                  {new Date(order.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={statusInfo.color as any} className="mt-1">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Pagamento:</span>
                <p className="font-semibold capitalize">
                  {order.payment_method?.replace("_", " ")}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <span className="text-muted-foreground text-sm">Cliente:</span>
              <p className="font-semibold">{order.client_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="flex-1">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Acompanhe seu Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${order.status !== 'pending' ? 'bg-green-500' : 'bg-muted'}`} />
              <span className={order.status !== 'pending' ? 'text-foreground' : 'text-muted-foreground'}>
                Pedido recebido
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${['in_production', 'in_packaging', 'released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-muted'}`} />
              <span className={['in_production', 'in_packaging', 'released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'text-foreground' : 'text-muted-foreground'}>
                Pagamento confirmado
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${['in_packaging', 'released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'bg-green-500' : order.status === 'in_production' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={['in_packaging', 'released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'text-foreground' : order.status === 'in_production' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                Em produção
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${['released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'bg-green-500' : order.status === 'in_packaging' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={['released_for_sale', 'sale_confirmed', 'in_delivery', 'delivered'].includes(order.status) ? 'text-foreground' : order.status === 'in_packaging' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                Em embalagem
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${['in_delivery', 'delivered'].includes(order.status) ? 'bg-green-500' : ['released_for_sale', 'sale_confirmed'].includes(order.status) ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={['in_delivery', 'delivered'].includes(order.status) ? 'text-foreground' : ['released_for_sale', 'sale_confirmed'].includes(order.status) ? 'text-primary font-medium' : 'text-muted-foreground'}>
                Produto enviado
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : order.status === 'in_delivery' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className={order.status === 'delivered' ? 'text-foreground' : order.status === 'in_delivery' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                Entregue
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/loja">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar Comprando
          </Button>
        </Link>
      </div>
    </div>
  );
}