import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calculator } from 'lucide-react';
import { useTaxCalculationRules, TaxCalculationRule } from '@/hooks/useTaxCalculationRules';

export const TaxCalculationRulesSection = () => {
  const { rules, loading, saving, saveRule, deleteRule } = useTaxCalculationRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxCalculationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    tax_regime: 'lucro_presumido',
    apply_to: 'all_products',
    filter_value: '',
    icms_cst: '60',
    icms_aliquota: 18,
    icms_reducao_base: 0,
    pis_cst: '01',
    pis_aliquota: 1.65,
    cofins_cst: '01',
    cofins_aliquota: 7.6,
    ipi_cst: '50',
    ipi_aliquota: 0,
    priority_order: 1
  });

  const taxRegimes = [
    { value: 'mei', label: 'MEI' },
    { value: 'simples_nacional', label: 'Simples Nacional' },
    { value: 'lucro_presumido', label: 'Lucro Presumido' },
    { value: 'lucro_real', label: 'Lucro Real' }
  ];

  const applyToOptions = [
    { value: 'all_products', label: 'Todos os produtos' },
    { value: 'by_category', label: 'Por categoria' },
    { value: 'by_ncm', label: 'Por NCM específico' }
  ];

  const resetForm = () => {
    setFormData({
      rule_name: '',
      tax_regime: 'lucro_presumido',
      apply_to: 'all_products',
      filter_value: '',
      icms_cst: '60',
      icms_aliquota: 18,
      icms_reducao_base: 0,
      pis_cst: '01',
      pis_aliquota: 1.65,
      cofins_cst: '01',
      cofins_aliquota: 7.6,
      ipi_cst: '50',
      ipi_aliquota: 0,
      priority_order: 1
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: TaxCalculationRule) => {
    setFormData({
      rule_name: rule.rule_name,
      tax_regime: rule.tax_regime,
      apply_to: rule.apply_to,
      filter_value: rule.filter_value || '',
      icms_cst: rule.icms_cst,
      icms_aliquota: rule.icms_aliquota,
      icms_reducao_base: rule.icms_reducao_base,
      pis_cst: rule.pis_cst,
      pis_aliquota: rule.pis_aliquota,
      cofins_cst: rule.cofins_cst,
      cofins_aliquota: rule.cofins_aliquota,
      ipi_cst: rule.ipi_cst,
      ipi_aliquota: rule.ipi_aliquota,
      priority_order: rule.priority_order
    });
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const ruleData = {
      ...formData,
      ...(editingRule && { id: editingRule.id }),
      is_active: true
    };

    await saveRule(ruleData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta regra de cálculo?')) {
      await deleteRule(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Regras de Cálculo de Impostos
        </CardTitle>
        <CardDescription>
          Configure regras automáticas para cálculo de impostos baseado no regime tributário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            As regras são aplicadas por ordem de prioridade e especificidade
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Editar' : 'Nova'} Regra de Cálculo
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule_name">Nome da Regra</Label>
                    <Input
                      id="rule_name"
                      value={formData.rule_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                      placeholder="Ex: Regra Simples Nacional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_regime">Regime Tributário</Label>
                    <Select 
                      value={formData.tax_regime} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tax_regime: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxRegimes.map(regime => (
                          <SelectItem key={regime.value} value={regime.value}>
                            {regime.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="apply_to">Aplicar Para</Label>
                    <Select 
                      value={formData.apply_to} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, apply_to: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {applyToOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.apply_to === 'by_category' || formData.apply_to === 'by_ncm') && (
                    <div>
                      <Label htmlFor="filter_value">
                        {formData.apply_to === 'by_category' ? 'Categoria' : 'NCM'}
                      </Label>
                      <Input
                        id="filter_value"
                        value={formData.filter_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, filter_value: e.target.value }))}
                        placeholder={formData.apply_to === 'by_category' ? 'Nome da categoria' : '0000.00.00'}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="priority_order">Prioridade</Label>
                    <Input
                      id="priority_order"
                      type="number"
                      value={formData.priority_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority_order: parseInt(e.target.value) }))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Configurações de Impostos</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium mb-3">ICMS</h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="icms_cst">CST/CSOSN</Label>
                          <Input
                            id="icms_cst"
                            value={formData.icms_cst}
                            onChange={(e) => setFormData(prev => ({ ...prev, icms_cst: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="icms_aliquota">Alíquota (%)</Label>
                          <Input
                            id="icms_aliquota"
                            type="number"
                            step="0.01"
                            value={formData.icms_aliquota}
                            onChange={(e) => setFormData(prev => ({ ...prev, icms_aliquota: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-3">PIS</h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="pis_cst">CST</Label>
                          <Input
                            id="pis_cst"
                            value={formData.pis_cst}
                            onChange={(e) => setFormData(prev => ({ ...prev, pis_cst: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pis_aliquota">Alíquota (%)</Label>
                          <Input
                            id="pis_aliquota"
                            type="number"
                            step="0.01"
                            value={formData.pis_aliquota}
                            onChange={(e) => setFormData(prev => ({ ...prev, pis_aliquota: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-3">COFINS</h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="cofins_cst">CST</Label>
                          <Input
                            id="cofins_cst"
                            value={formData.cofins_cst}
                            onChange={(e) => setFormData(prev => ({ ...prev, cofins_cst: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cofins_aliquota">Alíquota (%)</Label>
                          <Input
                            id="cofins_aliquota"
                            type="number"
                            step="0.01"
                            value={formData.cofins_aliquota}
                            onChange={(e) => setFormData(prev => ({ ...prev, cofins_aliquota: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-3">IPI</h5>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="ipi_cst">CST</Label>
                          <Input
                            id="ipi_cst"
                            value={formData.ipi_cst}
                            onChange={(e) => setFormData(prev => ({ ...prev, ipi_cst: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ipi_aliquota">Alíquota (%)</Label>
                          <Input
                            id="ipi_aliquota"
                            type="number"
                            step="0.01"
                            value={formData.ipi_aliquota}
                            onChange={(e) => setFormData(prev => ({ ...prev, ipi_aliquota: parseFloat(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regra</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>ICMS</TableHead>
              <TableHead>PIS/COFINS</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="font-medium">{rule.rule_name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {taxRegimes.find(r => r.value === rule.tax_regime)?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {applyToOptions.find(a => a.value === rule.apply_to)?.label}
                    {rule.filter_value && (
                      <div className="text-muted-foreground">
                        {rule.filter_value}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>CST: {rule.icms_cst}</div>
                    <div>{rule.icms_aliquota}%</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>PIS: {rule.pis_aliquota}%</div>
                    <div>COFINS: {rule.cofins_aliquota}%</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{rule.priority_order}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
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
      </CardContent>
    </Card>
  );
};