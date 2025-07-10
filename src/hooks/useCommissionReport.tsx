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
      console.log('[COMMISSION_REPORT] Iniciando carregamento de comissões com filtros:', filters);
      
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
        console.log('[COMMISSION_REPORT] Filtrando para vendedor:', user?.id);
      } 
      // Se filtro de vendedor especificado (para admins)
      else if (filters.sellerId) {
        query = query.eq('salesperson_id', filters.sellerId);
        console.log('[COMMISSION_REPORT] Filtrando por ID do vendedor:', filters.sellerId);
      }
      // Se busca por nome do vendedor (para admins)
      else if (filters.sellerName && userRole !== 'seller') {
        // Primeiro tentar encontrar o vendedor pelo nome nos usuários configurados
        const { data: sellerUsers } = await supabase
          .from('seller_commissions')
          .select('user_id')
          .eq('is_active', true);
        
        console.log('[COMMISSION_REPORT] Vendedores ativos encontrados:', sellerUsers);
        
        // Se temos vendedores configurados, filtrar por seus IDs
        if (sellerUsers && sellerUsers.length > 0) {
          const sellerIds = sellerUsers.map(s => s.user_id);
          query = query.in('salesperson_id', sellerIds);
          
          // Se tem nome específico, filtrar também por nome
          if (filters.sellerName.trim()) {
            query = query.ilike('seller', `%${filters.sellerName}%`);
          }
        } else {
          // Fallback: filtrar apenas por nome
          query = query.ilike('seller', `%${filters.sellerName}%`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[COMMISSION_REPORT] Pedidos encontrados:', data?.length || 0);

      // Calcular comissões para cada pedido
      const commissionsData: CommissionData[] = [];

      for (const order of data || []) {
        console.log('[COMMISSION_REPORT] Processando pedido:', {
          id: order.id,
          order_number: order.order_number,
          salesperson_id: order.salesperson_id,
          seller: order.seller,
          total_amount: order.total_amount
        });

        let totalCommission = 0;
        const items = [];
        let sellerName = 'N/A';
        let appliedCommissionConfig = null;

        // Melhorar correlação vendedor-comissão: se não tem salesperson_id mas tem seller name, tentar encontrar
        let actualSalespersonId = order?.salesperson_id;
        if (!actualSalespersonId && order?.seller) {
          const knownSellersByName = {
            'Thor Albuquerque': '50813b14-8b0c-40cf-a55c-76bf2a4a19b1',
            'Nathalia Albuquerque': '6c0bf94a-f544-4452-9aaf-9a702c028967'
          };
          actualSalespersonId = knownSellersByName[order.seller];
          console.log('[COMMISSION_REPORT] Correlacionando vendedor por nome:', {
            seller: order.seller,
            found_id: actualSalespersonId
          });
        }

        // Definir nome do vendedor
        const knownSellers = {
          '50813b14-8b0c-40cf-a55c-76bf2a4a19b1': 'Thor Albuquerque',
          '6c0bf94a-f544-4452-9aaf-9a702c028967': 'Nathalia Albuquerque'
        };

        if (order?.seller && order.seller !== 'N/A') {
          sellerName = order.seller;
        } else if (actualSalespersonId && knownSellers[actualSalespersonId]) {
          sellerName = knownSellers[actualSalespersonId];
        } else if (actualSalespersonId) {
          sellerName = `Vendedor ${actualSalespersonId.substring(0, 8)}...`;
        }

        // Buscar configuração de comissão do vendedor (usando ID real ou correlacionado)
        const sellerCommission = actualSalespersonId ? await getCommissionByUserId(actualSalespersonId) : null;
        console.log('[COMMISSION_REPORT] Configuração de comissão encontrada:', sellerCommission);

        // Calcular comissão para cada item do pedido
        for (const item of order?.order_items || []) {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          let commissionAmount = 0;
          let commissionType = 'inherit';
          let commissionValue = 0;

          // Priorizar configuração do vendedor sobre configuração do produto
          if (sellerCommission && sellerCommission.is_active) {
            appliedCommissionConfig = sellerCommission;
            commissionType = sellerCommission.commission_type;
            commissionValue = sellerCommission.commission_value;
            
            if (sellerCommission.commission_type === 'percentage') {
              commissionAmount = (item.total_price * sellerCommission.commission_value) / 100;
            } else if (sellerCommission.commission_type === 'fixed') {
              commissionAmount = sellerCommission.commission_value * item.quantity;
            }
            
            console.log('[COMMISSION_REPORT] Aplicando comissão do vendedor:', {
              type: sellerCommission.commission_type,
              value: sellerCommission.commission_value,
              item_total: item.total_price,
              calculated: commissionAmount
            });
          } else if (product && product.commission_type && product.commission_type !== 'inherit') {
            // Usar configuração do produto se não houver configuração do vendedor
            commissionType = product.commission_type;
            commissionValue = product.commission_value || 0;
            
            if (product.commission_type === 'percentage') {
              commissionAmount = (item.total_price * (product.commission_value || 0)) / 100;
            } else if (product.commission_type === 'fixed') {
              commissionAmount = (product.commission_value || 0) * item.quantity;
            }
            
            console.log('[COMMISSION_REPORT] Aplicando comissão do produto:', {
              type: product.commission_type,
              value: product.commission_value,
              item_total: item.total_price,
              calculated: commissionAmount
            });
          }

          totalCommission += commissionAmount;
          
          items.push({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            commission_type: commissionType,
            commission_value: commissionValue,
            calculated_commission: commissionAmount
          });
        }

        console.log('[COMMISSION_REPORT] Comissão total calculada para pedido:', {
          order_number: order.order_number,
          total_commission: totalCommission,
          seller_name: sellerName,
          commission_config: appliedCommissionConfig
        });

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

      console.log('[COMMISSION_REPORT] Dados finais de comissão:', commissionsData);
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