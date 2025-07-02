import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InternalProduction {
  id: string;
  production_number: string;
  product_id: string;
  product_name: string;
  quantity_requested: number;
  quantity_produced: number;
  status: string;
  created_at: string;
  start_date?: string;
  completion_date?: string;
}

export const InternalProductionTable = () => {
  const [productions, setProductions] = useState<InternalProduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternalProductions();
  }, []);

  const fetchInternalProductions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('production')
        .select('*')
        .eq('user_id', user.id)
        .is('order_item_id', null) // Produção interna não tem order_item_id
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Erro ao carregar produções internas:', error);
      toast.error('Erro ao carregar produções internas');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('production')
        .update({
          status: 'in_progress',
          start_date: new Date().toISOString().split('T')[0],
          quantity_produced: quantity
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Produção iniciada!');
      fetchInternalProductions();
    } catch (error) {
      console.error('Erro ao iniciar produção:', error);
      toast.error('Erro ao iniciar produção');
    }
  };

  const handleCompleteProduction = async (id: string, productId: string, quantity: number) => {
    try {
      // Atualizar status da produção
      const { error: productionError } = await supabase
        .from('production')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (productionError) throw productionError;

      // Para produção interna, adicionar direto ao estoque
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const newStock = (product.stock || 0) + quantity;

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (stockError) throw stockError;

      toast.success(`Produção concluída! ${quantity} unidades adicionadas ao estoque.`);
      fetchInternalProductions();
    } catch (error) {
      console.error('Erro ao concluir produção:', error);
      toast.error('Erro ao concluir produção');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          Carregando produções internas...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produção</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center">Qtd Solicitada</TableHead>
              <TableHead className="text-center">Qtd Produzida</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Conclusão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions.map((production) => (
              <TableRow key={production.id}>
                <TableCell className="font-medium">
                  {production.production_number}
                </TableCell>
                <TableCell>{production.product_name}</TableCell>
                <TableCell className="text-center">
                  {production.quantity_requested}
                </TableCell>
                <TableCell className="text-center">
                  {production.quantity_produced || 0}
                </TableCell>
                <TableCell>{formatDate(production.start_date)}</TableCell>
                <TableCell>{formatDate(production.completion_date)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(production.status)}`}>
                    {production.status === 'pending' ? 'Pendente' : 
                     production.status === 'in_progress' ? 'Em Produção' : 
                     production.status === 'completed' ? 'Concluída' : production.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    {production.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartProduction(production.id, production.quantity_requested)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {production.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleCompleteProduction(
                          production.id, 
                          production.product_id, 
                          production.quantity_produced || production.quantity_requested
                        )}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {productions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma produção interna encontrada.</p>
            <p className="text-sm">Crie uma nova produção interna para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};