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
import { RefreshCw, Package, User } from 'lucide-react';
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useTrocas, NovoTrocaData } from "@/hooks/useTrocas";
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
    produto_devolvido_id: '',
    produto_novo_id: '',
    quantidade: 1,
    motivo: '',
    responsavel: '',
    observacoes: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id || !formData.produto_devolvido_id || !formData.produto_novo_id || !formData.motivo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await criarTroca(formData);
      onClose(true);
      setFormData({
        cliente_id: '',
        produto_devolvido_id: '',
        produto_novo_id: '',
        quantidade: 1,
        motivo: '',
        responsavel: '',
        observacoes: ''
      });
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Registrar Troca de Produto
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Produto Devolvido *</Label>
              <Select value={formData.produto_devolvido_id} onValueChange={(value) => setFormData(prev => ({ ...prev, produto_devolvido_id: value }))}>
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
              <Select value={formData.produto_novo_id} onValueChange={(value) => setFormData(prev => ({ ...prev, produto_novo_id: value }))}>
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
                value={formData.quantidade}
                onChange={(e) => setFormData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
              />
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

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
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