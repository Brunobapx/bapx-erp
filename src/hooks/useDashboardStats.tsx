
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from '@/components/Auth/AuthProvider';

export type DashboardStats = {
  orders: number;
  production: number;
  packaging: number;
  sales: number;
  finance: number;
  routes: number;
  pendingOrders: number;
  pendingProduction: number;
  pendingPackaging: number;
  pendingSales: number;
  pendingFinance: number;
  pendingRoutes: number;
};

export type RecentOrder = {
  id: string;
  order_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export const useDashboardStats = () => {
  const { user, companyInfo } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    orders: 0,
    production: 0,
    packaging: 0,
    sales: 0,
    finance: 0,
    routes: 0,
    pendingOrders: 0,
    pendingProduction: 0,
    pendingPackaging: 0,
    pendingSales: 0,
    pendingFinance: 0,
    pendingRoutes: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user || !companyInfo) {
          throw new Error('Usuário não autenticado ou empresa não encontrada');
        }

        // Buscar estatísticas de pedidos da empresa
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (ordersError) throw ordersError;

        // Buscar estatísticas de produção da empresa
        const { data: productionData, error: productionError } = await supabase
          .from('production')
          .select('status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (productionError) throw productionError;

        // Buscar estatísticas de embalagem da empresa
        const { data: packagingData, error: packagingError } = await supabase
          .from('packaging')
          .select('status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (packagingError) throw packagingError;

        // Buscar estatísticas de vendas da empresa
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (salesError) throw salesError;

        // Buscar estatísticas financeiras da empresa
        const { data: financeData, error: financeError } = await supabase
          .from('financial_entries')
          .select('payment_status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (financeError) throw financeError;

        // Buscar estatísticas de rotas da empresa
        const { data: routesData, error: routesError } = await supabase
          .from('delivery_routes')
          .select('status')
          .eq('company_id', companyInfo.id); // Mudança aqui: usar company_id

        if (routesError) throw routesError;

        // Buscar pedidos recentes da empresa
        const { data: recentOrdersData, error: recentOrdersError } = await supabase
          .from('orders')
          .select('id, order_number, client_name, total_amount, status, created_at')
          .eq('company_id', companyInfo.id) // Mudança aqui: usar company_id
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentOrdersError) throw recentOrdersError;

        // Calcular estatísticas
        const newStats = {
          orders: ordersData?.length || 0,
          production: productionData?.length || 0,
          packaging: packagingData?.length || 0,
          sales: salesData?.length || 0,
          finance: financeData?.length || 0,
          routes: routesData?.length || 0,
          pendingOrders: ordersData?.filter(o => o.status === 'pending').length || 0,
          pendingProduction: productionData?.filter(p => p.status === 'pending').length || 0,
          pendingPackaging: packagingData?.filter(p => p.status === 'pending').length || 0,
          pendingSales: salesData?.filter(s => s.status === 'pending').length || 0,
          pendingFinance: financeData?.filter(f => f.payment_status === 'pending').length || 0,
          pendingRoutes: routesData?.filter(r => r.status === 'pending').length || 0,
        };

        setStats(newStats);
        setRecentOrders(recentOrdersData || []);

      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError(err.message || 'Erro ao carregar dados do dashboard');
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, companyInfo]);

  return {
    stats,
    recentOrders,
    loading,
    error,
  };
};
