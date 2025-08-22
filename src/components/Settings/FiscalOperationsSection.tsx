import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { useFiscalOperations, FiscalOperation } from '@/hooks/useFiscalOperations';

export const FiscalOperationsSection = () => {
  const { operations, loading, saving, saveOperation, deleteOperation } = useFiscalOperations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<FiscalOperation | null>(null);
  const [formData, setFormData] = useState({
    operation_type: '',
    operation_name: '',
    cfop_dentro_estado: '',
    cfop_fora_estado: '',
    cfop_exterior: '',
    description: ''
  });

  const operationTypes = [
    { value: 'venda', label: 'Venda' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'bonificacao', label: 'Bonificação' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'industrializacao', label: 'Industrialização' },
    { value: 'consignacao', label: 'Consignação' },
    { value: 'remessa', label: 'Remessa' },
    { value: 'retorno', label: 'Retorno' }
  ];

  const resetForm = () => {
    setFormData({
      operation_type: '',
      operation_name: '',
      cfop_dentro_estado: '',
      cfop_fora_estado: '',
      cfop_exterior: '',
      description: ''
    });
    setEditingOperation(null);
  };

  const handleEdit = (operation: FiscalOperation) => {
    setFormData({
      operation_type: operation.operation_type,
      operation_name: operation.operation_name,
      cfop_dentro_estado: operation.cfop_dentro_estado,
      cfop_fora_estado: operation.cfop_fora_estado,
      cfop_exterior: operation.cfop_exterior || '',
      description: operation.description || ''
    });
    setEditingOperation(operation);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const operationData = {
      ...formData,
      ...(editingOperation && { id: editingOperation.id }),
      is_active: true
    };

    await saveOperation(operationData);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta operação fiscal?')) {
      await deleteOperation(id);
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
          <FileText className="h-5 w-5" />
          CFOPs por Operação
        </CardTitle>
        <CardDescription>
          Configure os CFOPs para cada tipo de operação fiscal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Os CFOPs são aplicados automaticamente baseado no tipo de operação e destino
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Operação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingOperation ? 'Editar' : 'Nova'} Operação Fiscal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="operation_type">Tipo de Operação</Label>
                    <Select 
                      value={formData.operation_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, operation_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="operation_name">Nome da Operação</Label>
                    <Input
                      id="operation_name"
                      value={formData.operation_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, operation_name: e.target.value }))}
                      placeholder="Ex: Venda de Mercadoria"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cfop_dentro_estado">CFOP Dentro do Estado</Label>
                    <Input
                      id="cfop_dentro_estado"
                      value={formData.cfop_dentro_estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, cfop_dentro_estado: e.target.value }))}
                      placeholder="5xxx"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cfop_fora_estado">CFOP Fora do Estado</Label>
                    <Input
                      id="cfop_fora_estado"
                      value={formData.cfop_fora_estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, cfop_fora_estado: e.target.value }))}
                      placeholder="6xxx"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cfop_exterior">CFOP Exterior (opcional)</Label>
                    <Input
                      id="cfop_exterior"
                      value={formData.cfop_exterior}
                      onChange={(e) => setFormData(prev => ({ ...prev, cfop_exterior: e.target.value }))}
                      placeholder="7xxx"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da operação fiscal"
                  />
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
              <TableHead>Operação</TableHead>
              <TableHead>Dentro do Estado</TableHead>
              <TableHead>Fora do Estado</TableHead>
              <TableHead>Exterior</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{operation.operation_name}</div>
                    <Badge variant="secondary" className="text-xs">
                      {operation.operation_type}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{operation.cfop_dentro_estado}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{operation.cfop_fora_estado}</Badge>
                </TableCell>
                <TableCell>
                  {operation.cfop_exterior ? (
                    <Badge variant="outline">{operation.cfop_exterior}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(operation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(operation.id)}
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