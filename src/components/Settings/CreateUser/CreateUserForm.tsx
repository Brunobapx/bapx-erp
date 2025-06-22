
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { CreateUserFormState, CreateUserFormValidationErrors } from "./useCreateUserForm";

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface CreateUserFormProps {
  form: CreateUserFormState;
  validationErrors: CreateUserFormValidationErrors;
  loading: boolean;
  availableProfiles: AccessProfile[];
  userRole: string;
  onFieldChange: (field: keyof CreateUserFormState, value: string) => void;
  onSubmit: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  form,
  validationErrors,
  loading,
  availableProfiles,
  userRole,
  onFieldChange,
  onSubmit,
}) => {
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-4">
      {validationErrors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.general}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className={validationErrors.firstName ? 'text-red-600' : ''}>
            Nome *
          </Label>
          <Input
            id="firstName"
            type="text"
            value={form.firstName}
            onChange={e => onFieldChange('firstName', e.target.value)}
            placeholder="Nome"
            className={validationErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}
            disabled={loading}
            maxLength={50}
          />
          {validationErrors.firstName && (
            <p className="text-sm text-red-600">{validationErrors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className={validationErrors.lastName ? 'text-red-600' : ''}>
            Sobrenome *
          </Label>
          <Input
            id="lastName"
            type="text"
            value={form.lastName}
            onChange={e => onFieldChange('lastName', e.target.value)}
            placeholder="Sobrenome"
            className={validationErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}
            disabled={loading}
            maxLength={50}
          />
          {validationErrors.lastName && (
            <p className="text-sm text-red-600">{validationErrors.lastName}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className={validationErrors.email ? 'text-red-600' : ''}>
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={e => onFieldChange('email', e.target.value)}
          placeholder="usuario@email.com"
          className={validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}
          disabled={loading}
          maxLength={254}
        />
        {validationErrors.email && (
          <p className="text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={validationErrors.password ? 'text-red-600' : ''}>
          Senha Temporária *
        </Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={e => onFieldChange('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className={validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}
          disabled={loading}
          maxLength={128}
        />
        {validationErrors.password && (
          <p className="text-sm text-red-600">{validationErrors.password}</p>
        )}
        <p className="text-xs text-gray-500">
          Deve conter pelo menos: 1 maiúscula, 1 minúscula e 1 número
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            type="text"
            value={form.department}
            onChange={e => onFieldChange('department', e.target.value)}
            placeholder="Ex: Vendas"
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Cargo</Label>
          <Input
            id="position"
            type="text"
            value={form.position}
            onChange={e => onFieldChange('position', e.target.value)}
            placeholder="Ex: Vendedor"
            disabled={loading}
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className={validationErrors.role ? 'text-red-600' : ''}>
          Papel *
        </Label>
        <Select 
          value={form.role} 
          onValueChange={value => onFieldChange('role', value)}
          disabled={loading}
        >
          <SelectTrigger className={validationErrors.role ? 'border-red-500' : ''}>
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
        {validationErrors.role && (
          <p className="text-sm text-red-600">{validationErrors.role}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profileId" className={validationErrors.profileId ? 'text-red-600' : ''}>
          Perfil de Acesso *
        </Label>
        <Select 
          value={form.profileId} 
          onValueChange={value => onFieldChange('profileId', value)}
          disabled={loading}
        >
          <SelectTrigger className={validationErrors.profileId ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecionar perfil" />
          </SelectTrigger>
          <SelectContent>
            {availableProfiles
              .filter(profile => profile.is_active)
              .map(profile => (
                <SelectItem value={profile.id} key={profile.id}>
                  {profile.name} - {profile.description}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {validationErrors.profileId && (
          <p className="text-sm text-red-600">{validationErrors.profileId}</p>
        )}
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={loading || hasErrors} 
        className="w-full"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Criando...
          </>
        ) : (
          "Criar Usuário"
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        * Campos obrigatórios
      </p>
    </div>
  );
};
