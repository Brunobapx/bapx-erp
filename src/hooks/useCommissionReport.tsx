import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { CommissionFilters } from '@/components/Reports/CommissionFilters';
import { CommissionData } from '@/components/Reports/CommissionTable';
import { useSellerCommissions } from './useSellerCommissions';

export const useCommissionReport = () => {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userRole } = useAuth();
  const { getCommissionByUserId } = useSellerCommissions();
  
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
      
      // Buscar pedidos no período
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          client_name,
          total_amount,
          status,
          created_at,
          salesperson_id,
          seller,
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
        `)
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)
        .in('status', ['sale_confirmed', 'delivered']);

      // Se for vendedor, filtrar por seus pedidos
      if (userRole === 'seller') {
        query = query.eq('salesperson_id', user?.id);
      } 
      // Se filtro de vendedor especificado (para admins)
      else if (filters.sellerId) {
        query = query.eq('salesperson_id', filters.sellerId);
      }
      // Se busca por nome do vendedor (para admins)
      else if (filters.sellerName && userRole !== 'seller') {
        // Filtrar por campo seller diretamente
        query = query.ilike('seller', `%${filters.sellerName}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular comissões para cada pedido
      const commissionsData: CommissionData[] = [];

      for (const order of data || []) {
        let totalCommission = 0;
        const items = [];

        // Buscar configuração de comissão do vendedor
        const sellerCommission = order?.salesperson_id ? await getCommissionByUserId(order.salesperson_id) : null;

        // Calcular comissão para cada item do pedido
        for (const item of order?.order_items || []) {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          let commissionAmount = 0;

          // Priorizar configuração do vendedor sobre configuração do produto
          if (sellerCommission && sellerCommission.is_active) {
            if (sellerCommission.commission_type === 'percentage') {
              commissionAmount = (item.total_price * sellerCommission.commission_value) / 100;
            } else if (sellerCommission.commission_type === 'fixed') {
              commissionAmount = sellerCommission.commission_value * item.quantity;
            }
          } else if (product) {
            // Usar configuração do produto se não houver configuração do vendedor
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
            commission_type: sellerCommission?.commission_type || product?.commission_type || 'inherit',
            commission_value: sellerCommission?.commission_value || product?.commission_value || 0,
            calculated_commission: commissionAmount
          });
        }

        // Buscar nome do vendedor - usar o campo seller do pedido se disponível
        let sellerName = 'N/A';
        if (order?.seller) {
          sellerName = order.seller;
        } else if (order?.salesperson_id) {
          // Se não há o campo seller, tentar buscar através de user_roles  
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', order.salesperson_id)
            .eq('role', 'seller')
            .single();
          
          if (userRoles) {
            sellerName = `Vendedor ${order.salesperson_id.substring(0, 8)}...`;
          }
        }

        commissionsData.push({
          id: order.id,
          sale_number: order.order_number,
          order_number: order.order_number,
          client_name: order.client_name,
          seller_name: sellerName,
          sale_date: order.created_at,
          total_amount: order.total_amount,
          commission_amount: totalCommission,
          commission_percentage: order.total_amount > 0 ? (totalCommission / order.total_amount) * 100 : 0,
          status: order.status,
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