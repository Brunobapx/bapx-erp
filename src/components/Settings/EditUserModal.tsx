
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface EditUserModalProps {
  user: SimpleUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: AccessProfile[];
  userRole: string;
}

export const EditUserModal = ({
  user,
  open,
  onOpenChange,
  onSuccess,
  availableProfiles,
  userRole
}: EditUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    position: '',
    role: 'user',
    profile_id: '',
    new_password: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        position: user.position || '',
        role: user.role || 'user',
        profile_id: user.profile_id || '',
        new_password: ''
      });
    }
  }, [user, open]);

  const canManageUser = (targetUser: SimpleUser) => {
    if (userRole === 'master') return true;
    if (userRole === 'admin' && targetUser.role !== 'master') return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canManageUser(user)) {
      toast({
        title: "Erro",
        description: "Você não tem permissão para editar este usuário",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Atualizar dados do perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department,
          position: formData.position,
          profile_id: formData.profile_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar role se mudou
      if (formData.role !== user.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', user.id);

        if (roleError) throw roleError;
      }

      // Atualizar senha se fornecida
      if (formData.new_password.trim()) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: formData.new_password }
        );

        if (passwordError) {
          // Se não conseguir via admin, tentar via edge function
          const { error: functionError } = await supabase.functions.invoke('update-user-password', {
            body: { 
              userId: user.id, 
              newPassword: formData.new_password 
            },
            headers: {
              'x-requester-role': userRole,
            },
          });

          if (functionError) {
            console.warn('Não foi possível atualizar a senha:', functionError);
            toast({
              title: "Aviso",
              description: "Usuário atualizado, mas não foi possível alterar a senha. Peça para o usuário redefinir a senha.",
              variant: "default",
            });
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isEditable = canManageUser(user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                disabled={!isEditable}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                disabled={!isEditable}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-gray-500">O email não pode ser alterado</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                disabled={!isEditable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                disabled={!isEditable}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={!isEditable}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {userRole === 'master' && (
                  <SelectItem value="master">Master</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_id">Perfil de Acesso</Label>
            <Select 
              value={formData.profile_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, profile_id: value }))}
              disabled={!isEditable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem perfil</SelectItem>
                {availableProfiles
                  .filter(profile => profile.is_active)
                  .map(profile => (
                    <SelectItem value={profile.id} key={profile.id}>
                      {profile.name} - {profile.description}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Nova Senha (opcional)</Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
              disabled={!isEditable}
              placeholder="Deixe em branco para manter a senha atual"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !isEditable}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
