
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaasPlans, SaasPlan } from '@/hooks/useSaasPlans';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

export const SaasPlansManagement = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useSaasPlans();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly',
    max_users: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billing_cycle: 'monthly',
      max_users: '',
    });
  };

  const handleCreate = async () => {
    try {
      await createPlan({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        features: [],
        is_active: true,
      });

      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar plano:', error);
    }
  };

  const handleEdit = (plan: SaasPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      max_users: plan.max_users?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;

    try {
      await updatePlan(editingPlan.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
      });

      setIsEditModalOpen(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    }
  };

  const handleDelete = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        await deletePlan(planId);
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Gestão de Planos</h3>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Básico, Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do plano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="99.90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
                <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_users">Máximo de Usuários</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Criar Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando planos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Max Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.description}</TableCell>
                    <TableCell>R$ {plan.price.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{plan.billing_cycle}</TableCell>
                    <TableCell>{plan.max_users || 'Ilimitado'}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Plano</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Preço (R$)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-billing_cycle">Ciclo de Cobrança</Label>
              <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max_users">Máximo de Usuários</Label>
              <Input
                id="edit-max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Atualizar Plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
