import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { useNotaFiscal } from '@/hooks/useNotaFiscal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Pedido {
  id: string;
  order_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const EmitirNotaFiscal = () => {
  const { emitirNota, emittingNota } = useNotaFiscal();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, client_name, total_amount, status, created_at')
        .eq('status', 'sale_confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleEmitir = async () => {
    if (!selectedPedido) {
      toast.error('Selecione um pedido para emitir a nota fiscal');
      return;
    }

    try {
      await emitirNota(selectedPedido);
      setSelectedPedido('');
    } catch (error) {
      console.error('Erro ao emitir nota:', error);
    }
  };

  const selectedPedidoData = pedidos.find(p => p.id === selectedPedido);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Emitir Nota Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pedido">Selecionar Pedido</Label>
          <Select
            value={selectedPedido}
            onValueChange={setSelectedPedido}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um pedido confirmado">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pedidos.map(pedido => (
                <SelectItem key={pedido.id} value={pedido.id}>
                  {pedido.order_number} - {pedido.client_name} - R$ {pedido.total_amount.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPedidoData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Número:</span> {selectedPedidoData.order_number}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span> {selectedPedidoData.client_name}
                </div>
                <div>
                  <span className="font-medium">Valor Total:</span> R$ {selectedPedidoData.total_amount.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedPedidoData.status}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Data:</span> {new Date(selectedPedidoData.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleEmitir} 
            disabled={!selectedPedido || emittingNota}
            className="min-w-32"
          >
            {emittingNota && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Emitir Nota Fiscal
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>• Apenas pedidos com status "Venda Confirmada" podem gerar notas fiscais</p>
          <p>• A nota será enviada para a SEFAZ através da API Focus NFe</p>
          <p>• Verifique se as configurações de nota fiscal estão corretas antes de emitir</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmitirNotaFiscal;