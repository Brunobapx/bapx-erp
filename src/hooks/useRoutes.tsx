
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RouteAssignment {
  id: string;
  route_name: string;
  vehicle_id: string;
  driver_name?: string;
  total_capacity_used: number;
  estimated_distance?: number;
  estimated_time?: number;
  status: string;
  vehicle?: {
    model: string;
    license_plate: string;
    capacity: number;
  };
}

export interface RouteItem {
  id: string;
  route_assignment_id: string;
  order_id: string;
  delivery_address: string;
  client_name: string;
  total_weight: number;
  sequence_order: number;
  status: string;
}

export interface OrderForRoute {
  id: string;
  order_number: string;
  client_name: string;
  delivery_address: string;
  total_weight: number;
  status: string;
  sale_id?: string;
  sale_number?: string;
}

export const useRoutes = () => {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteAssignment[]>([]);
  const [availableOrders, setAvailableOrders] = useState<OrderForRoute[]>([]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('route_assignments')
        .select(`
          *,
          vehicles (
            model,
            license_plate,
            capacity
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar rotas:', error);
      toast.error('Erro ao carregar rotas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOrders = async (specificOrderId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro buscar os IDs dos pedidos que já estão em rotas
      const { data: routeItems, error: routeItemsError } = await supabase
        .from('route_items')
        .select('order_id')
;

      if (routeItemsError) throw routeItemsError;

      const usedOrderIds = routeItems?.map(item => item.order_id) || [];

      // Buscar pedidos que estão prontos para entrega (confirmados em vendas)
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          client_name,
          clients!inner(address, city, state),
          order_items(
            quantity,
            products(weight)
          ),
          sales(
            id,
            sale_number
          )
        `)
        ;

      // Se um pedido específico foi solicitado, incluí-lo sempre
      if (specificOrderId) {
        query = query.or(`id.eq.${specificOrderId},status.in.(sale_confirmed,released_for_sale)`);
      } else {
        query = query.in('status', ['sale_confirmed', 'released_for_sale']);
      }

      // Se há pedidos já usados, excluí-los da consulta (exceto se for o específico)
      if (usedOrderIds.length > 0) {
        const excludeIds = specificOrderId 
          ? usedOrderIds.filter(id => id !== specificOrderId)
          : usedOrderIds;
        
        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Processar os dados para calcular peso total e endereço de entrega
      const processedOrders = (data || []).map(order => {
        const totalWeight = (order.order_items || []).reduce((sum: number, item: any) => {
          return sum + (item.quantity * (item.products?.weight || 1));
        }, 0);

        const client = Array.isArray(order.clients) ? order.clients[0] : order.clients;
        const deliveryAddress = client 
          ? `${client.address}, ${client.city} - ${client.state}`
          : 'Endereço não informado';

        const sale = Array.isArray(order.sales) ? order.sales[0] : order.sales;

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          delivery_address: deliveryAddress,
          total_weight: totalWeight,
          status: 'available',
          sale_id: sale?.id,
          sale_number: sale?.sale_number
        };
      });

      setAvailableOrders(processedOrders);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos disponíveis:', error);
      toast.error('Erro ao carregar pedidos disponíveis');
    }
  };

  const createOptimizedRoutes = async (selectedOrders: string[], vehicleId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do veículo
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;

      // Buscar detalhes dos pedidos selecionados
      const ordersToRoute = availableOrders.filter(order => 
        selectedOrders.includes(order.id)
      );

      // Verificar capacidade
      const totalWeight = ordersToRoute.reduce((sum, order) => sum + order.total_weight, 0);
      if (totalWeight > vehicle.capacity) {
        throw new Error(`Peso total (${totalWeight}kg) excede a capacidade do veículo (${vehicle.capacity}kg)`);
      }

      // Criar rota
      const routeName = `Rota ${new Date().toLocaleDateString('pt-BR')} - ${vehicle.model}`;
      
      const { data: routeData, error: routeError } = await supabase
        .from('route_assignments')
        .insert([{
          user_id: user.id,
          route_name: routeName,
          vehicle_id: vehicleId,
          driver_name: vehicle.driver_name,
          total_capacity_used: totalWeight,
          status: 'pending'
        }])
        .select()
        .single();

      if (routeError) throw routeError;

      // Criar itens da rota (ordenados por proximidade - implementação simplificada)
      const routeItems = ordersToRoute.map((order, index) => ({
        user_id: user.id,
        route_assignment_id: routeData.id,
        order_id: order.id,
        delivery_address: order.delivery_address,
        client_name: order.client_name,
        total_weight: order.total_weight,
        sequence_order: index + 1,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('route_items')
        .insert(routeItems);

      if (itemsError) throw itemsError;

      toast.success('Rota criada com sucesso!');
      await fetchRoutes();
      await fetchAvailableOrders();
      
      return routeData;
    } catch (error: any) {
      console.error('Erro ao criar rota:', error);
      toast.error(error.message || 'Erro ao criar rota');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    routes,
    availableOrders,
    loading,
    fetchRoutes,
    fetchAvailableOrders,
    createOptimizedRoutes
  };
};
