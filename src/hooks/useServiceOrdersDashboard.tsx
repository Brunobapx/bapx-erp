import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOrder } from './useServiceOrders';

export interface ServiceOrderStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  avgCompletionTime: number;
  overdueSla: number;
}

export interface TechnicianPerformance {
  id: string;
  name: string;
  totalOrders: number;
  completedOrders: number;
  avgTime: number;
  efficiency: number;
}

export interface ServiceOrderDashboard {
  stats: ServiceOrderStats;
  technicians: TechnicianPerformance[];
  recentOrders: ServiceOrder[];
  priorityDistribution: { [key: string]: number };
  typeDistribution: { [key: string]: number };
}

const fetchServiceOrdersDashboard = async (): Promise<ServiceOrderDashboard> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado!");

  // Buscar todas as ordens de serviço
  const { data: orders, error } = await supabase
    .from("service_orders")
    .select(`
      *,
      clients(name),
      service_order_materials(
        id,
        quantity,
        unit_value,
        subtotal,
        products(name, price)
      )
    `)
    .order("opened_at", { ascending: false });

  if (error) throw error;

  const allOrders = orders || [];

  // Calcular estatísticas
  const stats: ServiceOrderStats = {
    total: allOrders.length,
    open: allOrders.filter(o => o.status === 'Aberta').length,
    inProgress: allOrders.filter(o => o.status === 'Em Andamento').length,
    completed: allOrders.filter(o => o.status === 'Finalizada').length,
    avgCompletionTime: calculateAvgCompletionTime(allOrders),
    overdueSla: calculateOverdueSla(allOrders),
  };

  // Buscar performance dos técnicos
  const { data: techniciansData } = await supabase.rpc('get_technicians');
  const technicians: TechnicianPerformance[] = (techniciansData || []).map((tech: any) => {
    const techOrders = allOrders.filter(o => o.technician_id === tech.id);
    const completedOrders = techOrders.filter(o => o.status === 'Finalizada');
    
    return {
      id: tech.id,
      name: `${tech.first_name} ${tech.last_name}`.trim(),
      totalOrders: techOrders.length,
      completedOrders: completedOrders.length,
      avgTime: calculateAvgTime(completedOrders),
      efficiency: techOrders.length > 0 ? (completedOrders.length / techOrders.length) * 100 : 0
    };
  });

  // Distribuições
  const priorityDistribution = allOrders.reduce((acc, order) => {
    acc[order.priority] = (acc[order.priority] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const typeDistribution = allOrders.reduce((acc, order) => {
    acc[order.service_type] = (acc[order.service_type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  return {
    stats,
    technicians,
    recentOrders: allOrders.slice(0, 10),
    priorityDistribution,
    typeDistribution
  };
};

const calculateAvgCompletionTime = (orders: any[]): number => {
  const completedOrders = orders.filter(o => o.status === 'Finalizada' && o.opened_at);
  if (completedOrders.length === 0) return 0;

  const totalTime = completedOrders.reduce((acc, order) => {
    const openTime = new Date(order.opened_at).getTime();
    const closeTime = new Date().getTime(); // Assumindo finalizada agora
    return acc + (closeTime - openTime);
  }, 0);

  return Math.round(totalTime / completedOrders.length / (1000 * 60 * 60)); // em horas
};

const calculateOverdueSla = (orders: any[]): number => {
  const now = new Date();
  return orders.filter(order => {
    if (order.status === 'Finalizada') return false;
    const openTime = new Date(order.opened_at);
    const hoursDiff = (now.getTime() - openTime.getTime()) / (1000 * 60 * 60);
    
    // SLA baseado na prioridade
    const slaHours = {
      'Crítica': 4,
      'Alta': 8,
      'Média': 24,
      'Baixa': 48
    }[order.priority] || 24;
    
    return hoursDiff > slaHours;
  }).length;
};

const calculateAvgTime = (orders: any[]): number => {
  if (orders.length === 0) return 0;
  
  const totalTime = orders.reduce((acc, order) => {
    const openTime = new Date(order.opened_at).getTime();
    const closeTime = new Date().getTime();
    return acc + (closeTime - openTime);
  }, 0);

  return Math.round(totalTime / orders.length / (1000 * 60 * 60)); // em horas
};

export const useServiceOrdersDashboard = () => {
  return useQuery<ServiceOrderDashboard, Error>({
    queryKey: ["service_orders_dashboard"],
    queryFn: fetchServiceOrdersDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};