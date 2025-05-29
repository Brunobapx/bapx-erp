
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calculator, FileText } from 'lucide-react';

export const DRETab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock DRE data
  const dreData = {
    receitas: {
      vendasProdutos: 170800,
      vendasServicos: 25000,
      outrasReceitas: 5200,
      total: 201000
    },
    custos: {
      materiaPrima: 45000,
      maoDeObraProducao: 32000,
      custosIndiretos: 18000,
      total: 95000
    },
    despesas: {
      administrativas: 15000,
      vendas: 12000,
      financeiras: 8000,
      total: 35000
    }
  };

  const lucroBruto = dreData.receitas.total - dreData.custos.total;
  const lucroOperacional = lucroBruto - dreData.despesas.total;
  const margemBruta = (lucroBruto / dreData.receitas.total) * 100;
  const margemOperacional = (lucroOperacional / dreData.receitas.total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Demonstração do Resultado do Exercício (DRE)</h2>
        <div className="flex gap-2">
          <Button 
            variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Mensal
          </Button>
          <Button 
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('quarter')}
          >
            Trimestral
          </Button>
          <Button 
            variant={selectedPeriod === 'year' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedPeriod('year')}
          >
            Anual
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-lg font-bold text-blue-600">R$ {dreData.receitas.total.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className="text-lg font-bold text-purple-600">R$ {lucroBruto.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">{margemBruta.toFixed(1)}% margem</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Custos Total</p>
                <p className="text-lg font-bold text-orange-600">R$ {dreData.custos.total.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Lucro Operacional</p>
                <p className="text-lg font-bold text-green-600">R$ {lucroOperacional.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">{margemOperacional.toFixed(1)}% margem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">RECEITAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Vendas de Produtos</span>
              <span className="font-medium">R$ {dreData.receitas.vendasProdutos.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Vendas de Serviços</span>
              <span className="font-medium">R$ {dreData.receitas.vendasServicos.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Outras Receitas</span>
              <span className="font-medium">R$ {dreData.receitas.outrasReceitas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-green-600 pt-2">
              <span>TOTAL RECEITAS</span>
              <span>R$ {dreData.receitas.total.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">CUSTOS DOS PRODUTOS VENDIDOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Matéria Prima</span>
              <span className="font-medium">R$ {dreData.custos.materiaPrima.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Mão de Obra Produção</span>
              <span className="font-medium">R$ {dreData.custos.maoDeObraProducao.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Custos Indiretos</span>
              <span className="font-medium">R$ {dreData.custos.custosIndiretos.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-orange-600 pt-2">
              <span>TOTAL CUSTOS</span>
              <span>R$ {dreData.custos.total.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-purple-600 pt-4 border-t">
              <span>LUCRO BRUTO</span>
              <span>R$ {lucroBruto.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">DESPESAS OPERACIONAIS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Despesas Administrativas</span>
              <span className="font-medium">R$ {dreData.despesas.administrativas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Despesas de Vendas</span>
              <span className="font-medium">R$ {dreData.despesas.vendas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Despesas Financeiras</span>
              <span className="font-medium">R$ {dreData.despesas.financeiras.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-red-600 pt-2">
              <span>TOTAL DESPESAS</span>
              <span>R$ {dreData.despesas.total.toLocaleString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resultado Final */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">RESULTADO FINAL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Lucro Bruto</span>
              <span className="font-medium text-purple-600">R$ {lucroBruto.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>(-) Despesas Operacionais</span>
              <span className="font-medium text-red-600">R$ {dreData.despesas.total.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-green-600 pt-4 border-t text-lg">
              <span>LUCRO OPERACIONAL</span>
              <span>R$ {lucroOperacional.toLocaleString('pt-BR')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Margem Bruta</p>
                <p className="text-lg font-bold text-purple-600">{margemBruta.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Margem Operacional</p>
                <p className="text-lg font-bold text-green-600">{margemOperacional.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
