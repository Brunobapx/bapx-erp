import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, RefreshCw } from 'lucide-react';

export const OrderTrackingDebug: React.FC = () => {
  const [trackings, setTrackings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const loadTrackings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_item_tracking')
        .select(`
          *,
          order_items!inner(
            id,
            product_name,
            quantity,
            orders!inner(
              order_number,
              client_name,
              status
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrackings(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar trackings:', error);
      toast.error('Erro ao carregar trackings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadTrackings();
    }
  }, [visible]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'partial_ready': return 'bg-blue-500';
      case 'complete_ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setVisible(true)}
          variant="outline"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Debug Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Debug: Order Tracking</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={loadTrackings}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setVisible(false)}
                variant="outline"
                size="sm"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {trackings.map((tracking) => (
            <div key={tracking.id} className="border rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {tracking.order_items.orders.order_number}
                </span>
                <Badge className={getStatusColor(tracking.status)}>
                  {tracking.status}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Produto: {tracking.order_items.product_name}</div>
                <div>Cliente: {tracking.order_items.orders.client_name}</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="font-medium">Alvo:</div>
                    <div>{tracking.quantity_target}</div>
                  </div>
                  <div>
                    <div className="font-medium">Estoque:</div>
                    <div>{tracking.quantity_from_stock}</div>
                  </div>
                  <div>
                    <div className="font-medium">Produção:</div>
                    <div>{tracking.quantity_from_production}</div>
                  </div>
                  <div>
                    <div className="font-medium">Aprovado:</div>
                    <div>
                      {tracking.quantity_produced_approved || 0} + {tracking.quantity_packaged_approved || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {trackings.length === 0 && !loading && (
            <div className="text-center text-muted-foreground">
              Nenhum tracking encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};