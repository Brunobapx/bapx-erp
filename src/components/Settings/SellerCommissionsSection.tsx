import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import { useSellerCommissions, SellerCommission } from '@/hooks/useSellerCommissions';
import { useSellerUsers } from '@/hooks/useSellerUsers';
import { toast } from 'sonner';

interface CommissionFormData {
  user_id: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  is_active: boolean;
}

export const SellerCommissionsSection = () => {
  const { commissions, loading, createCommission, updateCommission, deleteCommission } = useSellerCommissions();
  const { sellers, loading: loadingSellers } = useSellerUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<SellerCommission | null>(null);
  const [formData, setFormData] = useState<CommissionFormData>({
    user_id: '',
    commission_type: 'percentage',
    commission_value: 0,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id.trim()) {
      toast.error('ID do usuário é obrigatório');
      return;
    }

    if (formData.commission_value <= 0) {
      toast.error('Valor da comissão deve ser maior que zero');
      return;
    }

    try {
      if (editingCommission) {
        await updateCommission(editingCommission.id, formData);
      } else {
        await createCommission(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      commission_type: 'percentage',
      commission_value: 0,
      is_active: true
    });
    setEditingCommission(null);
  };

  const handleEdit = (commission: SellerCommission) => {
    setFormData({
      user_id: commission.user_id,
      commission_type: commission.commission_type,
      commission_value: commission.commission_value,
      is_active: commission.is_active
    });
    setEditingCommission(commission);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta comissão?')) {
      await deleteCommission(id);
    }
  };

  const getCommissionDisplay = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Comissões de Vendedores
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Comissão
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCommission ? 'Editar Comissão' : 'Nova Comissão de Vendedor'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Vendedor</Label>
                  {editingCommission ? (
                    <Input
                      id="user_id"
                      value={`${formData.user_id.substring(0, 8)}...`}
                      disabled
                      className="font-mono text-sm"
                    />
                  ) : (
                    <Select 
                      value={formData.user_id} 
                      onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um vendedor" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border shadow-lg">
                        {loadingSellers ? (
                          <div className="p-2 text-center text-muted-foreground">
                            Carregando vendedores...
                          </div>
                        ) : sellers.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            Nenhum vendedor encontrado
                          </div>
                        ) : (
                          (() => {
                            const availableSellers = sellers.filter(seller => !commissions.some(c => c.user_id === seller.user_id));
                            console.log('🏪 Vendedores disponíveis para seleção:', {
                              allSellers: sellers,
                              existingCommissions: commissions,
                              availableSellers
                            });
                            
                            if (availableSellers.length === 0) {
                              return (
                                <div className="p-2 text-center text-muted-foreground">
                                  Todos os vendedores já possuem comissão configurada
                                </div>
                              );
                            }
                            
                            return availableSellers.map((seller) => (
                              <SelectItem key={seller.user_id} value={seller.user_id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {seller.display_name || `Vendedor ${seller.user_id.substring(0, 8)}...`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {seller.email || `ID: ${seller.user_id.substring(0, 8)}...`}
                                  </span>
                                </div>
                              </SelectItem>
                            ));
                           })()
                         )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_type">Tipo de Comissão</Label>
                  <Select 
                    value={formData.commission_type} 
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData({ ...formData, commission_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_value">
                    Valor da Comissão {formData.commission_type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="commission_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.commission_value}
                    onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCommission ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando comissões...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Nenhuma comissão de vendedor cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((commission) => (
                    <TableRow key={commission.id}>
                       <TableCell>
                         <div className="flex flex-col">
                           <span className="font-medium">
                             {sellers.find(s => s.user_id === commission.user_id)?.display_name || `Vendedor ${commission.user_id.substring(0, 8)}...`}
                           </span>
                           <span className="text-xs text-muted-foreground font-mono">
                             {commission.user_id.substring(0, 8)}...
                           </span>
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {commission.commission_type === 'percentage' ? (
                            <Percent className="h-4 w-4" />
                          ) : (
                            <DollarSign className="h-4 w-4" />
                          )}
                          {commission.commission_type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCommissionDisplay(commission.commission_type, commission.commission_value)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          commission.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {commission.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(commission)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(commission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};