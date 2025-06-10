
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Building, Users, CreditCard, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalCompanies: number;
  activeSubscriptions: number;
  totalRevenue: number;
  newCompaniesThisMonth: number;
}

export const SaasDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    newCompaniesThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      // Total de empresas
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Assinaturas ativas
      const { count: activeSubscriptions } = await supabase
        .from('company_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Receita total (simulada - baseada nas assinaturas ativas)
      const { data: subscriptions } = await supabase
        .from('company_subscriptions')
        .select(`
          saas_plans:plan_id(price)
        `)
        .eq('status', 'active');

      const totalRevenue = subscriptions?.reduce((acc, sub: any) => {
        return acc + (sub.saas_plans?.price || 0);
      }, 0) || 0;

      // Novas empresas este mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newCompaniesThisMonth } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalCompanies: totalCompanies || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
        newCompaniesThisMonth: newCompaniesThisMonth || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newCompaniesThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Empresas com planos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newCompaniesThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Novas empresas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral do SaaS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status do Sistema</span>
              <Badge variant="default">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Uptime</span>
              <Badge variant="outline">99.9%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Última Atualização</span>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
