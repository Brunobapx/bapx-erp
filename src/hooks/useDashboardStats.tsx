import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface DashboardStats {
  orders: number;
  production: number;
  packaging: number;
  sales: number;
  clients: number;
  products: number;
  pending_receivables: number;
  overdue_receivables: number;
  total_receivables_amount: number;
  total_payables_amount: number;
  finance: number;
  routes: number;
  pendingOrders?: number;
  pendingProduction?: number;
  pendingPackaging?: number;
  pendingSales?: number;
  pendingFinance?: number;
  pendingRoutes?: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export interface SellerStats {
  myOrders: number;
  monthlyCommission: number;
  totalSales: number;
  pendingCommissions: number;
}

export const useDashboardStats = () => {
  const { user, isSeller } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    orders: 0,
    production: 0,
    packaging: 0,
    sales: 0,
    clients: 0,
    products: 0,
    pending_receivables: 0,
    overdue_receivables: 0,
    total_receivables_amount: 0,
    total_payables_amount: 0,
    finance: 0,
    routes: 0,
  });
  const [sellerStats, setSellerStats] = useState<SellerStats>({
    myOrders: 0,
    monthlyCommission: 0,
    totalSales: 0,
    pendingCommissions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading dashboard stats...');

      if (isSeller) {
        // Dados específicos para vendedores
        const [
          { count: myOrdersCount },
          { data: mySalesData },
          { data: myCommissionsData }
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('salesperson_id', user.id),
          supabase.from('sales').select('total_amount').eq('salesperson_id', user.id),
          supabase.from('commission_payments').select('total_commission').eq('seller_id', user.id).eq('status', 'pending')
        ]);

        const totalSales = mySalesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
        const pendingCommissions = myCommissionsData?.reduce((sum, comm) => sum + (comm.total_commission || 0), 0) || 0;

        // Calcular comissão do mês atual
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const { data: monthlyCommissionData } = await supabase
          .from('commission_payments')
          .select('total_commission')
          .eq('seller_id', user.id)
          .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

        const monthlyCommission = monthlyCommissionData?.reduce((sum, comm) => sum + (comm.total_commission || 0), 0) || 0;

        setSellerStats({
          myOrders: myOrdersCount || 0,
          monthlyCommission,
          totalSales,
          pendingCommissions,
        });

        // Buscar pedidos recentes do vendedor
        const { data: recentOrdersData } = await supabase
          .from('orders')
          .select('id, order_number, client_name, total_amount, status, created_at')
          .eq('salesperson_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentOrders(recentOrdersData || []);

      } else {
        // Dados gerais para administradores
        const [
          { count: ordersCount },
          { count: productionCount },
          { count: packagingCount },
          { count: salesCount },
          { count: clientsCount },
          { count: productsCount },
          { count: pendingReceivablesCount },
          { count: overdueReceivablesCount }
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('production').select('*', { count: 'exact', head: true }),
          supabase.from('packaging').select('*', { count: 'exact', head: true }),
          supabase.from('sales').select('*', { count: 'exact', head: true }),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('financial_entries').select('*', { count: 'exact', head: true }).eq('type', 'receivable').eq('payment_status', 'pending'),
          supabase.from('financial_entries').select('*', { count: 'exact', head: true }).eq('type', 'receivable').eq('payment_status', 'overdue')
        ]);

        // Buscar valores totais
        const { data: receivablesData } = await supabase
          .from('financial_entries')
          .select('amount')
          .eq('type', 'receivable')
          .eq('payment_status', 'pending');

        const { data: payablesData } = await supabase
          .from('accounts_payable')
          .select('amount')
          .eq('status', 'pending');

        const totalReceivablesAmount = receivablesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalPayablesAmount = payablesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

        // Buscar dados de delivery routes
        const { count: routesCount } = await supabase
          .from('delivery_routes')
          .select('*', { count: 'exact', head: true });

        setStats({
          orders: ordersCount || 0,
          production: productionCount || 0,
          packaging: packagingCount || 0,
          sales: salesCount || 0,
          clients: clientsCount || 0,
          products: productsCount || 0,
          pending_receivables: pendingReceivablesCount || 0,
          overdue_receivables: overdueReceivablesCount || 0,
          total_receivables_amount: totalReceivablesAmount,
          total_payables_amount: totalPayablesAmount,
          finance: pendingReceivablesCount || 0,
          routes: routesCount || 0,
        });

        // Buscar pedidos recentes gerais
        const { data: recentOrdersData } = await supabase
          .from('orders')
          .select('id, order_number, client_name, total_amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentOrders(recentOrdersData || []);
      }

    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      setError(error.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user, isSeller]);

  return {
    stats,
    sellerStats,
    recentOrders,
    loading,
    error,
    refreshStats: loadStats,
  };
};