import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSystemModules } from '@/hooks/useSystemModules';
import { User, Shield, Loader2 } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateUserModal = ({ open, onOpenChange, onSuccess }: CreateUserModalProps) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'user' as 'admin' | 'user',
    moduleIds: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { modules, loading: modulesLoading } = useSystemModules();

  const handleChange = (field: string, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      moduleIds: checked 
        ? [...prev.moduleIds, moduleId]
        : prev.moduleIds.filter(id => id !== moduleId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (form.userType === 'user' && form.moduleIds.length === 0) {
      setError('Usuários não-admin devem ter pelo menos um módulo selecionado');
      return;
    }

    try {
      setLoading(true);

      const { data, error: createError } = await supabase.functions.invoke('create-user', {
        body: {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          userType: form.userType,
          moduleIds: form.userType === 'admin' ? [] : form.moduleIds
        }
      });

      if (createError) throw createError;

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });

      // Reset form
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        userType: 'user',
        moduleIds: []
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.error || err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof modules>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do usuário e selecione suas permissões de acesso.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Digite o nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Digite o sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Digite o email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Digite a senha"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Usuário *</Label>
              <Select value={form.userType} onValueChange={(value) => handleChange('userType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Usuário
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.userType === 'user' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Permissões de Módulos</CardTitle>
                  <CardDescription className="text-xs">
                    Selecione quais módulos este usuário poderá acessar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modulesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando módulos...
                    </div>
                  ) : (
                    Object.entries(modulesByCategory).map(([category, categoryModules]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryModules.map((module) => (
                            <div key={module.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={module.id}
                                checked={form.moduleIds.includes(module.id)}
                                onCheckedChange={(checked) => 
                                  handleModuleToggle(module.id, checked as boolean)
                                }
                              />
                              <Label htmlFor={module.id} className="text-sm">
                                {module.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {form.userType === 'admin' && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Administradores têm acesso completo a todos os módulos do sistema.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};