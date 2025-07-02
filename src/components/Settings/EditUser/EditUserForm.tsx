
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface EditUserFormProps {
  user: UnifiedUser;
  form: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    position: string;
    role: string;
    profileId: string;
    isActive: boolean;
  };
  validationErrors: {
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string;
    position?: string;
    role?: string;
    profileId?: string;
  };
  loading: boolean;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  userRole: string;
  onFieldChange: (field: string, value: string | boolean) => void;
  onSubmit: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  form,
  validationErrors,
  loading,
  availableProfiles,
  userRole,
  onFieldChange,
  onSubmit,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            type="text"
            value={form.firstName}
            onChange={e => onFieldChange('firstName', e.target.value)}
            placeholder="Nome"
            className={validationErrors.firstName ? 'border-red-500' : ''}
          />
          {validationErrors.firstName && (
            <p className="text-sm text-red-500">{validationErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            type="text"
            value={form.lastName}
            onChange={e => onFieldChange('lastName', e.target.value)}
            placeholder="Sobrenome"
            className={validationErrors.lastName ? 'border-red-500' : ''}
          />
          {validationErrors.lastName && (
            <p className="text-sm text-red-500">{validationErrors.lastName}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={e => onFieldChange('email', e.target.value)}
          placeholder="usuario@email.com"
          className={validationErrors.email ? 'border-red-500' : ''}
        />
        {validationErrors.email && (
          <p className="text-sm text-red-500">{validationErrors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            type="text"
            value={form.department}
            onChange={e => onFieldChange('department', e.target.value)}
            placeholder="Departamento"
            className={validationErrors.department ? 'border-red-500' : ''}
          />
          {validationErrors.department && (
            <p className="text-sm text-red-500">{validationErrors.department}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            type="text"
            value={form.position}
            onChange={e => onFieldChange('position', e.target.value)}
            placeholder="Cargo"
            className={validationErrors.position ? 'border-red-500' : ''}
          />
          {validationErrors.position && (
            <p className="text-sm text-red-500">{validationErrors.position}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <Select value={form.role} onValueChange={role => onFieldChange('role', role)}>
          <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecionar papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            {userRole === 'master' && (
              <SelectItem value="master">Master</SelectItem>
            )}
          </SelectContent>
        </Select>
        {validationErrors.role && (
          <p className="text-sm text-red-500">{validationErrors.role}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profileId">Perfil de Acesso</Label>
        <Select value={form.profileId || "no-profile"} onValueChange={profileId => onFieldChange('profileId', profileId === "no-profile" ? "" : profileId)}>
          <SelectTrigger className={validationErrors.profileId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecionar perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-profile">Sem perfil</SelectItem>
            {availableProfiles
              .filter(profile => profile.is_active)
              .map(profile => (
                <SelectItem value={profile.id} key={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {validationErrors.profileId && (
          <p className="text-sm text-red-500">{validationErrors.profileId}</p>
        )}
      </div>

      <Button onClick={onSubmit} disabled={loading} className="w-full">
        {loading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : "Salvar Alterações"}
      </Button>
    </div>
  );
};

export default EditUserForm;
