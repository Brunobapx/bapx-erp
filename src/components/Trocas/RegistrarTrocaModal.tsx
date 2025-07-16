import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Package, User, Plus, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useTrocas, NovoTrocaData, NovoTrocaItem } from "@/hooks/useTrocas";
import { useAuth } from "@/components/Auth/AuthProvider";

interface RegistrarTrocaModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
}

const MOTIVOS_TROCA = [
  'Produto vencido',
  'Produto mofado', 
  'Produto estragado',
  'Defeito de fabricação',
  'Embalagem danificada'
];

export const RegistrarTrocaModal: React.FC<RegistrarTrocaModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<NovoTrocaData>({
    cliente_id: '',
    motivo: '',
    responsavel: '',
    observacoes: '',
    itens: [{
      produto_devolvido_id: '',
      produto_novo_id: '',
      quantidade: 1,
      observacoes_item: ''
    }]
  });
  const [loading, setLoading] = useState(false);

  const { clients } = useClients();
  const { products } = useProducts();
  const { criarTroca } = useTrocas();
  const { user } = useAuth();

  const produtosAtivos = products.filter(produto => (produto.stock || 0) > 0);

  useEffect(() => {
    if (user && isOpen) {
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        setFormData(prev => ({ ...prev, responsavel: fullName }));
      }
    }
  }, [user, isOpen]);

  const adicionarItem = () => {
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, {
        produto_devolvido_id: '',
        produto_novo_id: '',
        quantidade: 1,
        observacoes_item: ''
      }]
    }));
  };

  const removerItem = (index: number) => {
    if (formData.itens.length > 1) {
      setFormData(prev => ({
        ...prev,
        itens: prev.itens.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarItem = (index: number, campo: keyof NovoTrocaItem, valor: any) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id || !formData.motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    for (const item of formData.itens) {
      if (!item.produto_devolvido_id || !item.produto_novo_id) {
        toast.error('Todos os itens devem ter produtos devolvido e novo selecionados');
        return;
      }
    }

    setLoading(true);
    try {
      await criarTroca(formData);
      onClose(true);
      setFormData({
        cliente_id: '',
        motivo: '',
        responsavel: user?.user_metadata?.display_name || '',
        observacoes: '',
        itens: [{
          produto_devolvido_id: '',
          produto_novo_id: '',
          quantidade: 1,
          observacoes_item: ''
        }]
      });
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Registrar Troca de Produto
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={formData.cliente_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select value={formData.motivo} onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Motivo da troca" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_TROCA.map((motivo) => (
                    <SelectItem key={motivo} value={motivo}>
                      {motivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável *</Label>
            <Input
              value={formData.responsavel}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              placeholder="Nome do responsável"
            />
          </div>

          {/* Lista de itens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Itens da Troca</Label>
              <Button type="button" onClick={adicionarItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {formData.itens.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Item {index + 1}</CardTitle>
                    {formData.itens.length > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => removerItem(index)}
                        variant="outline" 
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Produto Devolvido *</Label>
                      <Select 
                        value={item.produto_devolvido_id} 
                        onValueChange={(value) => atualizarItem(index, 'produto_devolvido_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Produto devolvido" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Produto Novo *</Label>
                      <Select 
                        value={item.produto_novo_id} 
                        onValueChange={(value) => atualizarItem(index, 'produto_novo_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Produto novo" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtosAtivos.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - Estoque: {product.stock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Observações do Item</Label>
                      <Input
                        value={item.observacoes_item || ''}
                        onChange={(e) => atualizarItem(index, 'observacoes_item', e.target.value)}
                        placeholder="Observações específicas"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea
              value={formData.observacoes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Troca'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};