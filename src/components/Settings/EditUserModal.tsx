import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSystemModules } from '@/hooks/useSystemModules';
import { User, Shield, Loader2, Edit, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType } from '@/hooks/useUserManagement';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  onSuccess: () => void;
  isCurrentUser?: boolean;
}

export const EditUserModal = ({ open, onOpenChange, user, onSuccess, isCurrentUser = false }: EditUserModalProps) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    moduleIds: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { modules, loading: modulesLoading } = useSystemModules();

  useEffect(() => {
    if (user && open) {
      setForm({
        firstName: user.user_metadata.first_name || '',
        lastName: user.user_metadata.last_name || '',
        email: user.email,
        password: '',
        confirmPassword: '',
        moduleIds: user.moduleIds || []
      });
      setAvatarPreview(user.user_metadata.avatar_url || null);
      setError(null);
    }
  }, [user, open]);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      throw new Error('Erro ao fazer upload da foto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;

    if (form.password && form.password !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (form.password && form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = user.user_metadata.avatar_url;
      
      // Upload da foto se houver
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Preparar updates
      const updates: any = {
        user_metadata: {
          first_name: form.firstName,
          last_name: form.lastName,
          avatar_url: avatarUrl
        }
      };

      if (form.password) {
        updates.password = form.password;
      }

      // Para admins editando outros usuários, podem alterar email
      if (!isCurrentUser) {
        updates.email = form.email;
      }

      // Chamar a edge function para atualizar
      const { data, error: updateError } = await supabase.functions.invoke('update-user', {
        body: {
          userId: user.id,
          updates,
          moduleIds: isCurrentUser ? undefined : form.moduleIds // Só admins podem alterar módulos
        }
      });

      if (updateError) throw updateError;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err.message || 'Erro ao atualizar usuário');
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

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {isCurrentUser ? 'Meu Perfil' : 'Editar Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isCurrentUser 
              ? 'Atualize seus dados pessoais e foto de perfil'
              : 'Edite os dados do usuário e suas permissões de acesso'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              {!isCurrentUser && <TabsTrigger value="permissions">Permissões</TabsTrigger>}
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback>
                    {form.firstName.charAt(0)}{form.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm">
                      Alterar Foto
                    </Button>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou GIF (máx. 5MB)
                  </p>
                </div>
              </div>

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
                  disabled={isCurrentUser} // Usuários não podem alterar o próprio email
                />
                {isCurrentUser && (
                  <p className="text-xs text-muted-foreground">
                    Entre em contato com um administrador para alterar o email
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Digite a nova senha (deixe vazio para não alterar)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {form.password && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {!isCurrentUser && (
              <TabsContent value="permissions" className="space-y-6">
                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <Select value={user.role} disabled>
                    <SelectTrigger>
                      <SelectValue />
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
                      <SelectItem value="master">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Master
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Entre em contato com um administrador master para alterar o tipo
                  </p>
                </div>

                {user.role === 'user' && (
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

                {['admin', 'master'].includes(user.role || '') && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      {user.role === 'master' ? 'Masters' : 'Administradores'} têm acesso completo a todos os módulos do sistema.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            )}
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};