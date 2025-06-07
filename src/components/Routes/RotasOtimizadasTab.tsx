
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Route, ExternalLink, Package, RefreshCw, X, Trash2 } from 'lucide-react';
import { useRotasOtimizadas } from '@/hooks/useRotasOtimizadas';

const RotasOtimizadasTab = () => {
  const { 
    rotas, 
    loading, 
    pedidosDisponiveis, 
    pedidosEnviados,
    buscarPedidosDisponiveis, 
    gerarRotasOtimizadasComVeiculos,
    removerPedidoDaRoteirizacao,
    limparTodosPedidos
  } = useRotasOtimizadas();
  
  const [origem, setOrigem] = useState('');
  const [pedidosSelecionados, setPedidosSelecionados] = useState<string[]>([]);

  // Buscar pedidos automaticamente quando houver pedidos enviados
  useEffect(() => {
    console.log('RotasOtimizadasTab - Pedidos enviados alterados:', pedidosEnviados);
    if (pedidosEnviados.length > 0 && pedidosDisponiveis.length === 0) {
      console.log('Buscando pedidos disponíveis automaticamente');
      buscarPedidosDisponiveis();
    }
  }, [pedidosEnviados.length, pedidosDisponiveis.length]);

  const handleGerarRotas = async () => {
    if (!origem.trim() || pedidosSelecionados.length === 0) {
      alert('Por favor, preencha o endereço de origem e selecione pelo menos um pedido');
      return;
    }

    try {
      console.log('Gerando rotas com:', { origem, pedidosSelecionados });
      await gerarRotasOtimizadasComVeiculos(origem, pedidosSelecionados);
    } catch (error) {
      console.error('Erro ao gerar rotas:', error);
    }
  };

  const handleSelectPedido = (pedidoId: string, checked: boolean) => {
    if (checked) {
      setPedidosSelecionados([...pedidosSelecionados, pedidoId]);
    } else {
      setPedidosSelecionados(pedidosSelecionados.filter(id => id !== pedidoId));
    }
  };

  const handleSelectAll = () => {
    if (pedidosSelecionados.length === pedidosDisponiveis.length) {
      setPedidosSelecionados([]);
    } else {
      setPedidosSelecionados(pedidosDisponiveis.map(p => p.id));
    }
  };

  const handleRemoverPedido = (pedidoId: string) => {
    removerPedidoDaRoteirizacao(pedidoId);
    setPedidosSelecionados(prev => prev.filter(id => id !== pedidoId));
  };

  const handleLimparTodos = () => {
    if (window.confirm('Tem certeza que deseja remover todos os pedidos da roteirização?')) {
      limparTodosPedidos();
      setPedidosSelecionados([]);
    }
  };

  console.log('Estado atual:', { pedidosEnviados, pedidosDisponiveis, loading });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Rotas Otimizadas com Veículos</h2>
        <p className="text-muted-foreground">
          Selecione os pedidos enviados via "Romaneio" e gere rotas otimizadas automaticamente considerando veículos e regiões
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configurar Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="origem">Endereço de Origem</Label>
              <Input
                id="origem"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                placeholder="Ex: Rua das Flores, 123 - Centro, Rio de Janeiro"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Pedidos para Roteirização 
                  <span className="ml-1 text-sm text-muted-foreground">
                    ({pedidosDisponiveis.length} disponíveis de {pedidosEnviados.length} enviados)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={buscarPedidosDisponiveis}
                    disabled={loading || pedidosEnviados.length === 0}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar
                  </Button>
                  {pedidosDisponiveis.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {pedidosSelecionados.length === pedidosDisponiveis.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLimparTodos}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Limpar Todos
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
                {pedidosEnviados.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido enviado para roteirização.</p>
                    <p className="text-sm">Use o botão "Romaneio" na página de vendas para adicionar pedidos.</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
                    Carregando pedidos...
                  </div>
                ) : pedidosDisponiveis.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Dados dos pedidos não encontrados.</p>
                    <p className="text-sm">Clique em "Atualizar" para tentar novamente.</p>
                    <p className="text-xs mt-2">Pedidos enviados: {pedidosEnviados.length}</p>
                  </div>
                ) : (
                  pedidosDisponiveis.map((pedido) => (
                    <div key={pedido.id} className="flex items-start space-x-3 p-2 border rounded hover:bg-accent/5">
                      <Checkbox
                        id={pedido.id}
                        checked={pedidosSelecionados.includes(pedido.id)}
                        onCheckedChange={(checked) => handleSelectPedido(pedido.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{pedido.order_number}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                            {pedido.total_weight.toFixed(1)}kg
                          </span>
                          {pedido.sale_number && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                              {pedido.sale_number}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium">{pedido.client_name}</div>
                        <div className="text-xs text-muted-foreground">{pedido.delivery_address}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoverPedido(pedido.order_id)}
                        title="Remover da roteirização"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              
              {pedidosSelecionados.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {pedidosSelecionados.length} pedido(s) selecionado(s)
                </div>
              )}
            </div>

            <Button 
              onClick={handleGerarRotas}
              disabled={loading || !origem.trim() || pedidosSelecionados.length === 0}
              className="w-full"
            >
              {loading ? 'Gerando Rotas...' : 'Gerar Rotas Otimizadas'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Rotas Geradas ({rotas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rotas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma rota gerada ainda.</p>
                <p className="text-sm">Selecione os pedidos e configure a origem para gerar rotas otimizadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rotas.map((rota, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{rota.placa}</h4>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {rota.regiao}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>{rota.paradas.length} paradas:</strong>
                        </div>
                        
                        <div className="space-y-1">
                          {rota.paradas.map((parada, pidx) => (
                            <div key={pidx} className="text-sm flex items-start gap-2">
                              <span className="text-xs bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {pidx + 1}
                              </span>
                              <div>
                                <div className="font-medium">{parada.cliente}</div>
                                <div className="text-muted-foreground">{parada.endereco}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => window.open(rota.link, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Abrir no Google Maps
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RotasOtimizadasTab;
