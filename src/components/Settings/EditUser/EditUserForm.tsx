
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleUser } from '@/hooks/useSimpleUserManagement';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface EditUserFormProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    position: string;
    role: string;
    profile_id: string;
    new_password: string;
  };
  user: SimpleUser;
  availableProfiles: AccessProfile[];
  userRole: string;
  isEditable: boolean;
  loading: boolean;
  onFormDataChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  formData,
  user,
  availableProfiles,
  userRole,
  isEditable,
  loading,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => onFormDataChange('first_name', e.target.value)}
            disabled={!isEditable}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => onFormDataChange('last_name', e.target.value)}
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
            onChange={(e) => onFormDataChange('department', e.target.value)}
            disabled={!isEditable}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => onFormDataChange('position', e.target.value)}
            disabled={!isEditable}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => onFormDataChange('role', value)}
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
          onValueChange={(value) => onFormDataChange('profile_id', value)}
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
          onChange={(e) => onFormDataChange('new_password', e.target.value)}
          disabled={!isEditable}
          placeholder="Deixe em branco para manter a senha atual"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !isEditable}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
