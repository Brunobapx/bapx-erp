
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package, ClipboardCheck, PackageCheck } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PackagingPage = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [packagingOrders, setPackagingOrders] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackagingOrders();
  }, []);

  const fetchPackagingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Aguardando Embalagem');

      if (error) throw error;
      setPackagingOrders(data || []);
    } catch (error) {
      console.error('Error fetching packaging orders:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos para embalagem.",
        variant: "destructive",
      });
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handlePackagingApproval = async (formData) => {
    try {
      // Update order status based on the selected option in modal
      const newStatus = formData.status || 'Aguardando Venda';
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', formData.id);
      
      if (error) throw error;
      
      // Show success message
      toast({
        title: "Embalagem confirmada",
        description: `Pedido ${formData.id.substring(0, 8)} foi ${newStatus === 'Aguardando Venda' ? 'liberado para venda' : 'atualizado'}.`,
      });
      
      // Refresh order list
      fetchPackagingOrders();
    } catch (error) {
      console.error('Error approving packaging:', error);
      toast({
        title: "Erro ao confirmar embalagem",
        description: error.message || "Ocorreu um erro ao confirmar a embalagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate efficiency metrics
  const calculateMetrics = () => {
    const completedToday = 15; // Example value
    const pendingOrders = packagingOrders.length;
    const efficiency = pendingOrders > 0 ? (completedToday / (completedToday + pendingOrders)) * 100 : 100;
    
    return {
      completedToday,
      pendingOrders,
      efficiency: efficiency.toFixed(0)
    };
  };
  
  const metrics = calculateMetrics();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Embalagem</h1>
          <p className="text-muted-foreground">Gerenciamento de embalagem de produtos.</p>
        </div>
        <Button>
          <ClipboardCheck className="mr-2 h-4 w-4" /> Relatório de Embalagem
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Embalados Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eficiência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.efficiency}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PackageCheck className="mr-2 h-5 w-5" />
            Pedidos Aguardando Embalagem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Data Produção</TableHead>
                <TableHead>Prazo de Entrega</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packagingOrders.length > 0 ? (
                packagingOrders.map((order) => (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => handleOrderClick(order)}
                  >
                    <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{order.product_name}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>{new Date(order.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>{order.delivery_deadline ? new Date(order.delivery_deadline).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <span className="stage-badge badge-packaging">
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum pedido aguardando embalagem no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApprovalModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        stage="packaging"
        orderData={selectedOrder}
        onSave={handlePackagingApproval}
      />
    </div>
  );
};

export default PackagingPage;
