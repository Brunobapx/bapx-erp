
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Mock data for modules and permissions
const modules = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'clientes', name: 'Clientes' },
  { id: 'produtos', name: 'Produtos' },
  { id: 'fornecedores', name: 'Fornecedores' },
  { id: 'pedidos', name: 'Pedidos' },
  { id: 'producao', name: 'Produção' },
  { id: 'embalagem', name: 'Embalagem' },
  { id: 'vendas', name: 'Vendas' },
  { id: 'emissao-fiscal', name: 'Emissão Fiscal' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'rotas', name: 'Roteirização' },
  { id: 'calendario', name: 'Calendário' },
  { id: 'configuracoes', name: 'Configurações' }
];

const roles = ['Admin', 'Gerente', 'Operador', 'Vendedor'];

const initialPermissions = {
  'Admin': modules.reduce((acc, module) => {
    acc[module.id] = { view: true, create: true, edit: true, delete: true };
    return acc;
  }, {} as Record<string, { view: boolean, create: boolean, edit: boolean, delete: boolean }>),
  'Gerente': modules.reduce((acc, module) => {
    acc[module.id] = { view: true, create: true, edit: true, delete: false };
    return acc;
  }, {} as Record<string, { view: boolean, create: boolean, edit: boolean, delete: boolean }>),
  'Operador': modules.reduce((acc, module) => {
    acc[module.id] = { view: true, create: false, edit: false, delete: false };
    return acc;
  }, {} as Record<string, { view: boolean, create: boolean, edit: boolean, delete: boolean }>),
  'Vendedor': modules.reduce((acc, module) => {
    const isAccessible = ['dashboard', 'clientes', 'produtos', 'pedidos', 'vendas', 'calendario'].includes(module.id);
    acc[module.id] = { 
      view: isAccessible, 
      create: isAccessible && module.id !== 'dashboard', 
      edit: isAccessible && ['clientes', 'pedidos'].includes(module.id), 
      delete: false 
    };
    return acc;
  }, {} as Record<string, { view: boolean, create: boolean, edit: boolean, delete: boolean }>),
};

const PermissionManagement = () => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [permissions, setPermissions] = useState(initialPermissions);

  const handlePermissionChange = (moduleId: string, action: 'view' | 'create' | 'edit' | 'delete', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleId]: {
          ...prev[selectedRole][moduleId],
          [action]: value
        }
      }
    }));
  };

  const handleSave = () => {
    toast({
      title: "Permissões salvas",
      description: `As permissões para a função ${selectedRole} foram salvas com sucesso.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Permissões</CardTitle>
        <CardDescription>Configure as permissões de acesso para cada função do sistema</CardDescription>
        <div className="mt-4 w-full md:w-1/3">
          <Label htmlFor="role-select">Selecione a função</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select">
              <SelectValue placeholder="Selecione uma função" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Módulo</TableHead>
              <TableHead className="text-center">Visualizar</TableHead>
              <TableHead className="text-center">Criar</TableHead>
              <TableHead className="text-center">Editar</TableHead>
              <TableHead className="text-center">Excluir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell className="font-medium">{module.name}</TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={permissions[selectedRole][module.id].view}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'view', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={permissions[selectedRole][module.id].create}
                    disabled={!permissions[selectedRole][module.id].view}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'create', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={permissions[selectedRole][module.id].edit}
                    disabled={!permissions[selectedRole][module.id].view}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'edit', !!checked)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={permissions[selectedRole][module.id].delete}
                    disabled={!permissions[selectedRole][module.id].view}
                    onCheckedChange={(checked) => handlePermissionChange(module.id, 'delete', !!checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave}>Salvar Permissões</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionManagement;
