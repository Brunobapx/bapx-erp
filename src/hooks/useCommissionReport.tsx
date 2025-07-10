import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { CommissionFilters } from '@/components/Reports/CommissionFilters';
import { CommissionData } from '@/components/Reports/CommissionTable';

export const useCommissionReport = () => {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userRole } = useAuth();
  
  // Filtros padrão - mês atual
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`
    };
  };

  const { start, end } = getCurrentMonth();
  
  const [filters, setFilters] = useState<CommissionFilters>({
    startDate: start,
    endDate: end,
    sellerId: userRole === 'seller' ? user?.id || '' : '',
    sellerName: userRole === 'seller' ? user?.email || '' : ''
  });

  const updateFilters = (newFilters: Partial<CommissionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const loadCommissions = async () => {
    try {
      setLoading(true);
      
      // Buscar vendas confirmadas no período
      let query = supabase
        .from('sales')
        .select(`
          id,
          sale_number,
          order_id,
          client_name,
          total_amount,
          status,
          created_at,
          orders!inner (
            order_number,
            salesperson_id,
            order_items (
              product_id,
              product_name,
              quantity,
              unit_price,
              total_price,
              products (
                commission_type,
                commission_value
              )
            )
          )
        `)
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)
        .in('status', ['confirmed', 'invoiced', 'delivered']);

      // Se for vendedor, filtrar por seus pedidos
      if (userRole === 'seller') {
        query = query.eq('orders.salesperson_id', user?.id);
      } 
      // Se filtro de vendedor especificado (para admins)
      else if (filters.sellerId) {
        query = query.eq('orders.salesperson_id', filters.sellerId);
      }
      // Se busca por nome do vendedor
      else if (filters.sellerName && userRole !== 'seller') {
        // Buscar vendedor por email/nome
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'seller');
        
        if (userRoles && userRoles.length > 0) {
          const sellerIds = userRoles.map(ur => ur.user_id);
          query = query.in('orders.salesperson_id', sellerIds);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular comissões para cada venda
      const commissionsData: CommissionData[] = [];

      for (const sale of data || []) {
        let totalCommission = 0;
        const items = [];

        // Calcular comissão para cada item do pedido
        const order = Array.isArray(sale.orders) ? sale.orders[0] : sale.orders;
        for (const item of order?.order_items || []) {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          let commissionAmount = 0;

          if (product) {
            if (product.commission_type === 'percentage') {
              commissionAmount = (item.total_price * (product.commission_value || 0)) / 100;
            } else if (product.commission_type === 'fixed') {
              commissionAmount = (product.commission_value || 0) * item.quantity;
            }
          }

          totalCommission += commissionAmount;
          
          items.push({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            commission_type: product?.commission_type || 'inherit',
            commission_value: product?.commission_value || 0,
            calculated_commission: commissionAmount
          });
        }

        // Buscar nome do vendedor
        let sellerName = 'N/A';
        if (order?.salesperson_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(order.salesperson_id);
          sellerName = userData?.user?.email || 'N/A';
        }

        commissionsData.push({
          id: sale.id,
          sale_number: sale.sale_number,
          order_number: order?.order_number || '',
          client_name: sale.client_name,
          seller_name: sellerName,
          sale_date: sale.created_at,
          total_amount: sale.total_amount,
          commission_amount: totalCommission,
          commission_percentage: sale.total_amount > 0 ? (totalCommission / sale.total_amount) * 100 : 0,
          status: sale.status,
          items
        });
      }

      setCommissions(commissionsData);
    } catch (error: any) {
      console.error('Erro ao carregar relatório de comissões:', error);
      toast.error('Erro ao carregar relatório de comissões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCommissions();
    }
  }, [filters, user, userRole]);

  const totalCommissions = useMemo(() => {
    return commissions.reduce((sum, commission) => sum + commission.commission_amount, 0);
  }, [commissions]);

  const totalSales = useMemo(() => {
    return commissions.reduce((sum, commission) => sum + commission.total_amount, 0);
  }, [commissions]);

  return {
    commissions,
    loading,
    filters,
    updateFilters,
    totalCommissions,
    totalSales,
    refreshCommissions: loadCommissions
  };
};