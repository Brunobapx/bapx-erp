import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, Plus, TrendingDown, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { RegistrarTrocaModal } from '@/components/Trocas/RegistrarTrocaModal';
import { TrocasTable } from '@/components/Trocas/TrocasTable';
import { useTrocas } from '@/hooks/useTrocas';
import { usePerdas } from '@/hooks/usePerdas';
import { toast } from "sonner";

const TrocasPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('30'); // últimos 30 dias

  const { trocas, loading: trocasLoading, refreshTrocas } = useTrocas();
  const { perdas, loading: perdasLoading } = usePerdas();

  // Filtrar trocas baseado na busca
  const filteredTrocas = trocas.filter(troca => {
    const searchString = searchQuery.toLowerCase();
    return (
      troca.cliente?.name?.toLowerCase().includes(searchString) ||
      troca.produto_devolvido?.name?.toLowerCase().includes(searchString) ||
      troca.produto_novo?.name?.toLowerCase().includes(searchString) ||
      troca.motivo.toLowerCase().includes(searchString) ||
      troca.responsavel.toLowerCase().includes(searchString)
    );
  });

  // Calcular estatísticas
  const totalTrocas = trocas.length;
  const totalProdutosDescartados = trocas.reduce((acc, troca) => acc + troca.quantidade, 0);
  const custoEstimadoPerdas = trocas.reduce((acc, troca) => {
    const custo = troca.produto_devolvido?.cost || 0;
    return acc + (custo * troca.quantidade);
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleGenerateRomaneio = (troca: any) => {
    // Implementar geração de romaneio
    toast.info('Funcionalidade de romaneio em desenvolvimento');
  };

  const handleViewDetails = (troca: any) => {
    toast.info('Visualização de detalhes em desenvolvimento');
  };

  const handleRefresh = () => {
    refreshTrocas();
    toast.success('Dados atualizados');
  };

  const loading = trocasLoading || perdasLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Troca de Produtos
          </h1>
          <p className="text-muted-foreground">
            Registre e gerencie as trocas de produtos com defeito ou problemas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setShowRegistrarModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Troca
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <RefreshCw className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total de Trocas</p>
              <p className="text-xl font-bold text-blue-600">{totalTrocas}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <Package className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Produtos Descartados</p>
              <p className="text-xl font-bold text-orange-600">{totalProdutosDescartados}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <DollarSign className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Custo das Perdas</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(custoEstimadoPerdas)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <TrendingDown className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Média por Troca</p>
              <p className="text-xl font-bold text-purple-600">
                {totalTrocas > 0 ? formatCurrency(custoEstimadoPerdas / totalTrocas) : 'R$ 0,00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trocas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trocas">Lista de Trocas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="trocas" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar trocas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredTrocas.length} de {totalTrocas} trocas
              </Badge>
            </div>
          </div>

          {/* Tabela de Trocas */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">Carregando trocas...</div>
              </CardContent>
            </Card>
          ) : (
            <TrocasTable
              trocas={filteredTrocas}
              onViewDetails={handleViewDetails}
              onGenerateRomaneio={handleGenerateRomaneio}
            />
          )}
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Relatórios de Perdas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Relatórios em Desenvolvimento</h3>
                <p>
                  Os relatórios detalhados de perdas e estatísticas estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Nova Troca */}
      <RegistrarTrocaModal
        isOpen={showRegistrarModal}
        onClose={(refresh) => {
          setShowRegistrarModal(false);
          if (refresh) {
            refreshTrocas();
          }
        }}
      />
    </div>
  );
};

export default TrocasPage;