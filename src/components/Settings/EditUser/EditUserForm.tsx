
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleUser } from '@/hooks/useUserData';
import { useEditUserForm } from './useEditUserForm';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface EditUserFormProps {
  user: SimpleUser;
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
  availableProfiles: AccessProfile[];
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  userRole,
  onClose,
  onSuccess,
  availableProfiles,
}) => {
  const {
    formData,
    loading,
    validationErrors,
    canManageUser,
    handleFormDataChange,
    handleSubmit,
  } = useEditUserForm({ user, userRole, onSuccess, onClose });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationErrors.general && (
        <div className="text-red-500 text-sm">{validationErrors.general}</div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleFormDataChange('first_name', e.target.value)}
            disabled={!canManageUser}
            required
          />
          {validationErrors.first_name && (
            <div className="text-red-500 text-sm">{validationErrors.first_name}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleFormDataChange('last_name', e.target.value)}
            disabled={!canManageUser}
            required
          />
          {validationErrors.last_name && (
            <div className="text-red-500 text-sm">{validationErrors.last_name}</div>
          )}
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
            onChange={(e) => handleFormDataChange('department', e.target.value)}
            disabled={!canManageUser}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => handleFormDataChange('position', e.target.value)}
            disabled={!canManageUser}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => handleFormDataChange('role', value)}
          disabled={!canManageUser}
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
          onValueChange={(value) => handleFormDataChange('profile_id', value)}
          disabled={!canManageUser}
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
          onChange={(e) => handleFormDataChange('new_password', e.target.value)}
          disabled={!canManageUser}
          placeholder="Deixe em branco para manter a senha atual"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !canManageUser}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
