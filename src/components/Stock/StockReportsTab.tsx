import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, TrendingUp, Package, AlertTriangle, BarChart3 } from 'lucide-react';

type ReportType = 'stock_current' | 'stock_movement' | 'low_stock' | 'stock_valuation' | 'products_report' | 'categories_report';

interface StockReport {
  id: string;
  name: string;
  stock: number;
  price: number;
  cost: number;
  category: string;
  value: number;
}

interface StockMovement {
  id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  date: string;
  reference: string;
}

export const StockReportsTab = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('stock_current');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [category, setCategory] = useState<string>('');
  const [minStock, setMinStock] = useState<number>(10);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { value: 'stock_current', label: 'Estoque Atual', icon: Package },
    { value: 'stock_movement', label: 'Movimentação de Estoque', icon: TrendingUp },
    { value: 'low_stock', label: 'Produtos com Estoque Baixo', icon: AlertTriangle },
    { value: 'stock_valuation', label: 'Valorização do Estoque', icon: BarChart3 },
    { value: 'products_report', label: 'Relatório de Produtos', icon: FileText },
    { value: 'categories_report', label: 'Relatório por Categorias', icon: Package },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query;
      let data;

      switch (selectedReport) {
        case 'stock_current':
          query = supabase
            .from('products')
            .select('id, name, stock, price, cost, category')
            .eq('user_id', user.id)
            .order('name');
          break;

        case 'low_stock':
          query = supabase
            .from('products')
            .select('id, name, stock, price, cost, category')
            .eq('user_id', user.id)
            .lte('stock', minStock)
            .order('stock');
          break;

        case 'stock_valuation':
          query = supabase
            .from('products')
            .select('id, name, stock, price, cost, category')
            .eq('user_id', user.id)
            .order('name');
          break;

        case 'products_report':
          query = supabase
            .from('products')
            .select('id, name, stock, price, cost, category, sku, description, is_manufactured')
            .eq('user_id', user.id);
          if (category) {
            query = query.eq('category', category);
          }
          break;

        case 'categories_report':
          query = supabase
            .from('products')
            .select('category, stock, price, cost')
            .eq('user_id', user.id);
          break;

        case 'stock_movement':
          // Para movimentação de estoque, vamos simular com base em pedidos e vendas
          const { data: orders } = await supabase
            .from('order_items')
            .select(`
              id,
              product_name,
              quantity,
              created_at,
              orders!inner(order_number, created_at)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

          data = orders?.map(item => ({
            id: item.id,
            product_name: item.product_name,
            movement_type: 'Saída - Pedido',
            quantity: -item.quantity,
            date: new Date(item.created_at).toLocaleDateString('pt-BR'),
            reference: Array.isArray(item.orders) ? item.orders[0]?.order_number || 'N/A' : item.orders?.order_number || 'N/A'
          })) || [];
          
          setReportData(data);
          setLoading(false);
          return;
      }

      const { data: result, error } = await query;
      if (error) throw error;

      if (selectedReport === 'categories_report') {
        // Agrupar por categoria
        const categoryMap = new Map();
        result?.forEach((product: any) => {
          const cat = product.category || 'Sem Categoria';
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, {
              category: cat,
              total_products: 0,
              total_stock: 0,
              total_value: 0,
              avg_price: 0
            });
          }
          const categoryData = categoryMap.get(cat);
          categoryData.total_products += 1;
          categoryData.total_stock += product.stock || 0;
          categoryData.total_value += (product.stock || 0) * (product.price || 0);
        });

        // Calcular média de preços
        categoryMap.forEach((value, key) => {
          const products = result?.filter((p: any) => (p.category || 'Sem Categoria') === key) || [];
          const totalPrice = products.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
          value.avg_price = products.length > 0 ? totalPrice / products.length : 0;
        });

        data = Array.from(categoryMap.values());
      } else if (selectedReport === 'stock_valuation') {
        data = result?.map((product: any) => ({
          ...product,
          value_cost: (product.stock || 0) * (product.cost || 0),
          value_price: (product.stock || 0) * (product.price || 0),
          margin: product.price && product.cost ? ((product.price - product.cost) / product.price * 100) : 0
        })) || [];
      } else {
        data = result || [];
      }

      setReportData(data);
      toast({
        title: "Relatório gerado",
        description: `${data.length} registros encontrados`,
      });
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  const renderReportTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado encontrado. Clique em "Gerar Relatório" para visualizar os dados.
        </div>
      );
    }

    switch (selectedReport) {
      case 'stock_current':
      case 'low_stock':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category || 'Sem Categoria'}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.stock <= minStock ? 'destructive' : 'default'}>
                      {item.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">R$ {(item.price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {(item.cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {((item.stock || 0) * (item.price || 0)).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'stock_valuation':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Valor Custo</TableHead>
                <TableHead className="text-right">Valor Venda</TableHead>
                <TableHead className="text-right">Margem %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                  <TableCell className="text-right">R$ {(item.value_cost || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {(item.value_price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.margin > 30 ? 'default' : item.margin > 15 ? 'secondary' : 'destructive'}>
                      {(item.margin || 0).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'stock_movement':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>
                    <Badge variant={item.quantity > 0 ? 'default' : 'destructive'}>
                      {item.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{Math.abs(item.quantity)}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.reference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'categories_report':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Total Produtos</TableHead>
                <TableHead className="text-right">Estoque Total</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Preço Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{item.total_products}</TableCell>
                  <TableCell className="text-right">{item.total_stock}</TableCell>
                  <TableCell className="text-right">R$ {(item.total_value || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {(item.avg_price || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(reportData[0] || {}).map((key) => (
                  <TableHead key={key} className="capitalize">
                    {key.replace('_', ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item: any, index: number) => (
                <TableRow key={index}>
                  {Object.values(item).map((value: any, idx: number) => (
                    <TableCell key={idx}>
                      {typeof value === 'number' && value % 1 !== 0 
                        ? value.toFixed(2) 
                        : String(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
    }
  };

  const selectedReportInfo = reportTypes.find(r => r.value === selectedReport);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Configuração do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Relatório</Label>
              <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReport === 'low_stock' && (
              <div className="space-y-2">
                <Label htmlFor="min-stock">Estoque Mínimo</Label>
                <Input
                  id="min-stock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  placeholder="10"
                />
              </div>
            )}

            {selectedReport === 'products_report' && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoria (Opcional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Filtrar por categoria"
                />
              </div>
            )}

            {selectedReport === 'stock_movement' && (
              <>
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <DatePicker
                    date={dateFrom}
                    onDateChange={setDateFrom}
                    placeholder="Selecionar data"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <DatePicker
                    date={dateTo}
                    onDateChange={setDateTo}
                    placeholder="Selecionar data"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedReportInfo && <selectedReportInfo.icon className="h-5 w-5" />}
            {selectedReportInfo?.label}
            {reportData.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {reportData.length} registros
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-auto">
            {renderReportTable()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
