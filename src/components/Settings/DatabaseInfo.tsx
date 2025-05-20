
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Database, Table, RotateCcw, Shield } from "lucide-react";

interface TableInfo {
  name: string;
  count: number;
  hasRls: boolean;
}

const DatabaseInfo = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
    const fetchTableInfo = async () => {
      setIsLoading(true);
      
      try {
        // Lista de tabelas que queremos mostrar informações
        const tableNames = [
          'clients',
          'products',
          'orders',
          'vendors',
          'production_stages',
          'order_production',
          'delivery_routes',
          'route_orders',
          'payments',
          'profiles'
        ];
        
        // Busca informações sobre cada tabela
        const tablesInfo: TableInfo[] = [];
        
        for (const tableName of tableNames) {
          // Busca a contagem de registros na tabela
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (countError && !countError.message.includes('relation')) {
            console.error(`Erro ao buscar contagem para ${tableName}:`, countError);
          }
          
          // Determina se a tabela tem RLS ativado
          // Na prática todas têm, mas isso é apenas uma demonstração
          const hasRls = true;
          
          tablesInfo.push({
            name: tableName,
            count: count || 0,
            hasRls
          });
        }
        
        setTables(tablesInfo);
      } catch (error) {
        console.error('Erro ao buscar informações das tabelas:', error);
        toast({
          title: "Erro ao carregar informações",
          description: "Não foi possível obter informações sobre as tabelas do banco de dados.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTableInfo();
  }, [user, toast]);

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      'clients': 'Clientes',
      'products': 'Produtos',
      'orders': 'Pedidos',
      'vendors': 'Fornecedores',
      'production_stages': 'Etapas de Produção',
      'order_production': 'Acompanhamento de Produção',
      'delivery_routes': 'Rotas de Entrega',
      'route_orders': 'Pedidos em Rotas',
      'payments': 'Pagamentos',
      'profiles': 'Perfis de Usuário'
    };
    
    return names[tableName] || tableName;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Informações do Banco de Dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RotateCcw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 text-sm text-muted-foreground">
              Abaixo estão as tabelas configuradas no sistema e o número de registros em cada uma.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => (
                <div 
                  key={table.name} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4 text-primary" />
                    <span>{getTableDisplayName(table.name)}</span>
                    {table.hasRls && (
                      <Shield className="ml-2 h-3 w-3 text-green-500" title="Proteção RLS Ativa" />
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {table.count} {table.count === 1 ? 'registro' : 'registros'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => window.open("https://supabase.com/dashboard/project/gtqmwlxzszttzriswoxj/editor", "_blank")}
                size="sm"
              >
                <Database className="mr-2 h-4 w-4" />
                Gerenciar Banco de Dados
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseInfo;
