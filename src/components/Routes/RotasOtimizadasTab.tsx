
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Route, ExternalLink } from 'lucide-react';
import { useRotasOtimizadas, PedidoRota, RotaOtimizada } from '@/hooks/useRotasOtimizadas';

const RotasOtimizadasTab = () => {
  const { rotas, loading, gerarRotasOtimizadasComVeiculos } = useRotasOtimizadas();
  const [origem, setOrigem] = useState('');
  const [pedidosTexto, setPedidosTexto] = useState('');

  const handleGerarRotas = async () => {
    if (!origem.trim() || !pedidosTexto.trim()) {
      alert('Por favor, preencha o endereço de origem e os pedidos');
      return;
    }

    try {
      // Converter texto dos pedidos em array de objetos
      const linhas = pedidosTexto.split('\n').filter(linha => linha.trim());
      const pedidos: PedidoRota[] = linhas.map((linha, index) => {
        const partes = linha.split(' - ');
        return {
          id: `pedido-${index + 1}`,
          endereco: partes[0].trim(),
          cliente: partes[1]?.trim() || `Cliente ${index + 1}`
        };
      });

      console.log('Gerando rotas com:', { origem, pedidos });
      await gerarRotasOtimizadasComVeiculos(origem, pedidos);
    } catch (error) {
      console.error('Erro ao gerar rotas:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Rotas Otimizadas com Veículos</h2>
        <p className="text-muted-foreground">
          Gere rotas otimizadas automaticamente considerando veículos e regiões
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
              <Label htmlFor="pedidos">Pedidos (um por linha)</Label>
              <Textarea
                id="pedidos"
                value={pedidosTexto}
                onChange={(e) => setPedidosTexto(e.target.value)}
                placeholder={`Exemplo:
Rua A, 100 - Madureira - João Silva
Av. Brasil, 200 - Nova Iguaçu - Maria Santos
Rua C, 300 - Copacabana - Pedro Costa`}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Formato: Endereço - [Bairro] - [Cliente] (um pedido por linha)
              </p>
            </div>

            <Button 
              onClick={handleGerarRotas}
              disabled={loading || !origem.trim() || !pedidosTexto.trim()}
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
                Nenhuma rota gerada ainda. Configure e gere rotas usando o formulário ao lado.
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
