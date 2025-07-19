import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import { useTrocasReports, TrocaReportFilter } from '@/hooks/useTrocasReports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const TrocasReports = () => {
  const [filters, setFilters] = useState<TrocaReportFilter>({
    type: 'month'
  });
  
  const { reportData, loading, error, generateReport } = useTrocasReports();

  useEffect(() => {
    generateReport(filters);
  }, []);

  const handleFilterChange = (newFilters: Partial<TrocaReportFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    generateReport(updatedFilters);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getFilterLabel = () => {
    switch (filters.type) {
      case 'day': return 'Hoje';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'custom': return 'Período Personalizado';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Gerando relatório...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-destructive">Erro ao carregar relatório: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Nenhum dado disponível</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={filters.type}
                onValueChange={(value: any) => handleFilterChange({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.type === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={() => generateReport(filters)} className="w-full">
                <BarChart3 className="mr-2 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Trocas</p>
                <p className="text-2xl font-bold">{reportData.resumo.total_trocas}</p>
                <p className="text-xs text-muted-foreground mt-1">{getFilterLabel()}</p>
              </div>
              <div className="flex items-center gap-1">
                {reportData.resumo.crescimento_percentual >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <span className={`text-xs ${reportData.resumo.crescimento_percentual >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatPercentage(Math.abs(reportData.resumo.crescimento_percentual))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Descartados</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reportData.resumo.total_produtos_descartados}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total das Perdas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.resumo.custo_total_perdas)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média por Troca</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.resumo.media_perda_por_troca)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análises */}
      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="motivos">Motivos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top 10 Produtos Mais Trocados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.produtos_mais_trocados.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.produtos_mais_trocados.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="produto_nome" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value, name === 'total_trocas' ? 'Trocas' : 'Quantidade']}
                        labelFormatter={(label) => `Produto: ${label}`}
                      />
                      <Bar dataKey="total_trocas" fill="#8884d8" name="total_trocas" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {reportData.produtos_mais_trocados.slice(0, 5).map((produto, index) => (
                      <div key={produto.produto_id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}º</Badge>
                          <span className="font-medium">{produto.produto_nome}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{produto.total_trocas} trocas</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(produto.custo_total)} perdido
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motivos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Motivos Mais Utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.motivos_mais_utilizados.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.motivos_mais_utilizados.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ motivo, percentual }) => `${motivo}: ${formatPercentage(percentual)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {reportData.motivos_mais_utilizados.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2">
                    {reportData.motivos_mais_utilizados.map((motivo, index) => (
                      <div key={motivo.motivo} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{motivo.motivo}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{motivo.quantidade}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPercentage(motivo.percentual)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum motivo encontrado no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking de Clientes que Mais Trocam
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.clientes_mais_trocam.length > 0 ? (
                <div className="space-y-2">
                  {reportData.clientes_mais_trocam.map((cliente, index) => (
                    <div key={cliente.cliente_id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "destructive" : "outline"}>
                          {index + 1}º
                        </Badge>
                        <div>
                          <div className="font-medium">{cliente.cliente_nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {cliente.total_produtos} produtos trocados
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{cliente.total_trocas} trocas</div>
                        <div className="text-xs text-red-600">
                          {formatCurrency(cliente.valor_perdido)} perdido
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Evolução Temporal das Trocas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.evolucao_temporal.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.evolucao_temporal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                      formatter={(value, name) => [
                        name === 'total_trocas' ? value : formatCurrency(Number(value)),
                        name === 'total_trocas' ? 'Trocas' : 'Valor Perdido'
                      ]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="total_trocas" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="total_trocas"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="valor_perdido" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="valor_perdido"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado temporal encontrado no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};