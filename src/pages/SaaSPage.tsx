import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Users, Contact, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { CompaniesAdmin } from '@/components/Settings/CompaniesAdmin';

interface MetricItem {
  key: string;
  label: string;
  icon: React.ElementType;
}

const METRICS: MetricItem[] = [
  { key: 'companies', label: 'Empresas cadastradas', icon: Building2 },
  { key: 'profiles', label: 'Usuários', icon: Users },
  { key: 'clients', label: 'Contatos', icon: Contact },
  { key: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { key: 'sales', label: 'Vendas', icon: DollarSign },
  { key: 'products', label: 'Produtos', icon: Package },
];

export default function SaaSPage() {
  const { isAdmin, isMaster } = useAuth();
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState<boolean>(true);
  const [apiLatency, setApiLatency] = React.useState<number | null>(null);

  const isPrivileged = isAdmin || isMaster;

  const fetchCounts = React.useCallback(async () => {
    try {
      setLoading(true);
      // Measure API latency with a cheap RPC
      const start = performance.now();
      await supabase.rpc('get_row_count', { table_name: 'products' });
      setApiLatency(Math.round(performance.now() - start));

      const results = await Promise.all(
        METRICS.map(async (m) => {
          const { data, error } = await supabase.rpc('get_row_count', { table_name: m.key });
          if (error) {
            console.error('Erro ao contar', m.key, error);
            return [m.key, 0] as const;
          }
          return [m.key, Number(data) || 0] as const;
        })
      );
      setCounts(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // SEO basic tags
    document.title = 'SaaS Admin - BAPX ERP';
    const desc = 'Visão SaaS: empresas, usuários, contatos, pedidos, vendas e status do projeto.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  React.useEffect(() => {
    if (isPrivileged) fetchCounts();
  }, [isPrivileged, fetchCounts]);

  if (!isPrivileged) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <header className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SaaS</h1>
        </header>
        <Alert>
          <AlertDescription>
            Acesso restrito a administradores. Entre com uma conta admin/master.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="ajuda">Ajuda</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="white-label">White Label</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">SaaS - Visão Geral</h1>
            </div>
            <Button onClick={fetchCounts} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {METRICS.map(({ key, label, icon: Icon }) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{loading ? '—' : counts[key] ?? 0}</div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Status do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Latência da API</span>
                  <span className="text-sm font-medium">{apiLatency ? `${apiLatency} ms` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Memória do dispositivo</span>
                  <span className="text-sm font-medium">{(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Indisponível'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Navegador</span>
                  <span className="text-sm font-medium truncate max-w-[60%]" title={navigator.userAgent}>{navigator.userAgent}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atalhos de Administração</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={fetchCounts}>Recalcular métricas</Button>
                <Button variant="secondary" asChild>
                  <a href="/configuracoes">Ir para Configurações</a>
                </Button>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="empresas">
          <header className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Empresas</h1>
          </header>
          <div className="bg-white rounded-lg border p-4">
            <CompaniesAdmin />
          </div>
        </TabsContent>

        <TabsContent value="planos">
          <header className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Planos</h1>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Plano Básico</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Até 3 usuários. Recursos essenciais.</p>
                <Button variant="outline">Configurar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Plano Profissional</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Usuários ilimitados. Relatórios avançados.</p>
                <Button variant="outline">Configurar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Plano Enterprise</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">SLA, suporte dedicado e white label.</p>
                <Button variant="outline">Configurar</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ajuda">
          <header className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ajuda</h1>
          </header>
          <Card>
            <CardHeader><CardTitle>Central de Ajuda</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Precisa de suporte? Fale com a equipe ou consulte a documentação.</p>
              <div className="flex gap-3">
                <Button asChild variant="secondary"><a href="/configuracoes">Configurações</a></Button>
                <Button asChild variant="outline"><a href="#">Documentação</a></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <header className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </header>
          <Card>
            <CardHeader><CardTitle>Acesso às Configurações</CardTitle></CardHeader>
            <CardContent>
              <Button asChild><a href="/configuracoes">Abrir Configurações do Sistema</a></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="white-label">
          <header className="flex items-center gap-3 mb-6">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">White Label</h1>
          </header>
          <Card>
            <CardHeader><CardTitle>Personalização de Marca</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Configure cores, logo e subdomínio para clientes Enterprise.</p>
              <div className="flex gap-3">
                <Button variant="outline">Definir cores</Button>
                <Button variant="outline">Enviar logo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
