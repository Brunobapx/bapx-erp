import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { CommissionFilters } from '@/components/Reports/CommissionFilters';
import { CommissionData } from '@/components/Reports/CommissionTable';
import { useSellerCommissions } from './useSellerCommissions';

interface CompanyUser {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export const useCommissionReport = () => {
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const { user, isSeller } = useAuth();
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
    sellerId: isSeller ? user?.id || '' : '',
    sellerName: ''
  });

  const updateFilters = (newFilters: Partial<CommissionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Carregar usuários da empresa
  const loadCompanyUsers = async () => {
    try {
      const { data: usersResponse, error } = await supabase.functions.invoke('get-users');
      
      if (error) {
        console.error('Erro ao buscar usuários da empresa:', error);
        return;
      }

      if (usersResponse?.success) {
        setCompanyUsers(usersResponse.users || []);
        console.log('[COMMISSION_REPORT] Usuários da empresa carregados:', usersResponse.users?.length || 0);
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários da empresa:', error);
    }
  };

  // Mapear user ID para nome
  const getUserDisplayName = (userId: string): string => {
    const companyUser = companyUsers.find(u => u.id === userId);
    if (companyUser) {
      const firstName = companyUser.user_metadata?.first_name || '';
      const lastName = companyUser.user_metadata?.last_name || '';
      return firstName && lastName ? `${firstName} ${lastName}` : 
             firstName || `Vendedor ${userId.substring(0, 8)}...`;
    }
    return `Vendedor ${userId.substring(0, 8)}...`;
  };

  // Mapear nome para user ID (para busca reversa)
  const getUserIdByName = (name: string): string | null => {
    const companyUser = companyUsers.find(u => {
      const firstName = u.user_metadata?.first_name || '';
      const lastName = u.user_metadata?.last_name || '';
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
      return fullName.toLowerCase().includes(name.toLowerCase());
    });
    return companyUser?.id || null;
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
          seller_id,
          seller_name,
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
      if (isSeller) {
        const currentUserName = getUserDisplayName(user?.id || '');
        query = query.or(`seller_id.eq.${user?.id},seller_name.eq.${currentUserName}`);
        console.log('[COMMISSION_REPORT] Filtrando para vendedor:', user?.id, 'ou nome:', currentUserName);
      }
      // Se filtro de vendedor especificado (para admins)
      else if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
        console.log('[COMMISSION_REPORT] Filtrando por ID do vendedor:', filters.sellerId);
      }
      // Se busca por nome do vendedor (para admins)
      else if (filters.sellerName && !isSeller) {
        if (filters.sellerName.trim()) {
          const sellerName = filters.sellerName.trim();
          const foundUserId = getUserIdByName(sellerName);
          if (foundUserId) {
            query = query.or(`seller_id.eq.${foundUserId},seller_name.ilike.%${sellerName}%`);
          } else {
            query = query.ilike('seller_name', `%${sellerName}%`);
          }
          console.log('[COMMISSION_REPORT] Filtrando por nome do vendedor:', sellerName);
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
          seller_id: order.seller_id,
          seller_name: order.seller_name,
          total_amount: order.total_amount
        });

        let totalCommission = 0;
        const items = [];
        let sellerName = 'N/A';
        let appliedCommissionConfig = null;

        // Usar seller_id se disponível, senão tentar encontrar por nome
        let actualSellerId = order?.seller_id;
        if (!actualSellerId && order?.seller_name) {
          actualSellerId = getUserIdByName(order.seller_name);
          console.log('[COMMISSION_REPORT] Correlacionando vendedor por nome:', {
            seller_name: order.seller_name,
            found_id: actualSellerId
          });
        }

        // Definir nome do vendedor usando dados da empresa
        if (order?.seller_name && order.seller_name !== 'N/A') {
          sellerName = order.seller_name;
        } else if (actualSellerId) {
          sellerName = getUserDisplayName(actualSellerId);
        }

        // Buscar configuração de comissão do vendedor
        const sellerCommission = actualSellerId ? await getCommissionByUserId(actualSellerId) : null;
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

  // Carregar usuários da empresa quando o hook é inicializado
  useEffect(() => {
    loadCompanyUsers();
  }, []);

  useEffect(() => {
    if (user && companyUsers.length > 0) {
      loadCommissions();
    }
  }, [filters, user, isSeller, companyUsers]);

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