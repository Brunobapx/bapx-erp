import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText } from 'lucide-react';
import { CommissionReport } from '@/components/Reports/CommissionReport';

const ReportsPage = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gerencie e visualize relatórios do sistema.</p>
        </div>
      </div>
      
      <Tabs defaultValue="commissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vendas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="commissions" className="space-y-6">
          <CommissionReport />
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;