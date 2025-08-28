import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useTaxCalculationRules, TaxCalculationRule } from '@/hooks/useTaxCalculationRules';
import { toast } from 'sonner';

export function TaxCalculationRulesSection() {
  const { rules, loading, saving, saveRule, deleteRule } = useTaxCalculationRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxCalculationRule | null>(null);
  const [formData, setFormData] = useState<Partial<TaxCalculationRule>>({
    rule_name: '',
    regime_tributario: 'simples_nacional',
    icms_rate: 0,
    ipi_rate: 0,
    pis_rate: 1.65,
    cofins_rate: 7.6,
    csosn: '101',
    cst: '00',
    cfop_default: '5101',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      regime_tributario: 'simples_nacional',
      icms_rate: 0,
      ipi_rate: 0,
      pis_rate: 1.65,
      cofins_rate: 7.6,
      csosn: '101',
      cst: '00',
      cfop_default: '5101',
      is_active: true
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: TaxCalculationRule) => {
    setFormData({
      id: rule.id,
      rule_name: rule.rule_name,
      regime_tributario: rule.regime_tributario,
      icms_rate: rule.icms_rate,
      ipi_rate: rule.ipi_rate,
      pis_rate: rule.pis_rate,
      cofins_rate: rule.cofins_rate,
      csosn: rule.csosn || '101',
      cst: rule.cst || '00',
      cfop_default: rule.cfop_default || '5101',
      is_active: rule.is_active
    });
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.rule_name) {
      toast.error('Nome da regra é obrigatório');
      return;
    }

    await saveRule(formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta regra?')) {
      await deleteRule(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regras de Cálculo de Impostos</CardTitle>
          <CardDescription>Carregando regras...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Regras de Cálculo de Impostos
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Editar Regra' : 'Nova Regra de Cálculo'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule_name">Nome da Regra *</Label>
                    <Input
                      id="rule_name"
                      value={formData.rule_name}
                      onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                      placeholder="Ex: Regra Simples Nacional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regime_tributario">Regime Tributário</Label>
                    <Select
                      value={formData.regime_tributario}
                      onValueChange={(value) => setFormData({ ...formData, regime_tributario: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="csosn">CSOSN</Label>
                    <Input
                      id="csosn"
                      value={formData.csosn}
                      onChange={(e) => setFormData({ ...formData, csosn: e.target.value })}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cst">CST</Label>
                    <Input
                      id="cst"
                      value={formData.cst}
                      onChange={(e) => setFormData({ ...formData, cst: e.target.value })}
                      placeholder="00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cfop_default">CFOP Padrão</Label>
                    <Input
                      id="cfop_default"
                      value={formData.cfop_default}
                      onChange={(e) => setFormData({ ...formData, cfop_default: e.target.value })}
                      placeholder="5101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icms_rate">ICMS (%)</Label>
                    <Input
                      id="icms_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.icms_rate}
                      onChange={(e) => setFormData({ ...formData, icms_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pis_rate">PIS (%)</Label>
                    <Input
                      id="pis_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.pis_rate}
                      onChange={(e) => setFormData({ ...formData, pis_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cofins_rate">COFINS (%)</Label>
                    <Input
                      id="cofins_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.cofins_rate}
                      onChange={(e) => setFormData({ ...formData, cofins_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipi_rate">IPI (%)</Label>
                    <Input
                      id="ipi_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.ipi_rate}
                      onChange={(e) => setFormData({ ...formData, ipi_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Configure as regras de cálculo de impostos por regime tributário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma regra de cálculo cadastrada
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Regra</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead>CSOSN/CST</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead>ICMS %</TableHead>
                <TableHead>PIS %</TableHead>
                <TableHead>COFINS %</TableHead>
                <TableHead>IPI %</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.rule_name}</TableCell>
                  <TableCell>
                    {rule.regime_tributario === 'simples_nacional' && 'Simples Nacional'}
                    {rule.regime_tributario === 'lucro_presumido' && 'Lucro Presumido'}
                    {rule.regime_tributario === 'lucro_real' && 'Lucro Real'}
                  </TableCell>
                  <TableCell>{rule.csosn || rule.cst}</TableCell>
                  <TableCell>{rule.cfop_default}</TableCell>
                  <TableCell>{rule.icms_rate}%</TableCell>
                  <TableCell>{rule.pis_rate}%</TableCell>
                  <TableCell>{rule.cofins_rate}%</TableCell>
                  <TableCell>{rule.ipi_rate}%</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
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
  );
}