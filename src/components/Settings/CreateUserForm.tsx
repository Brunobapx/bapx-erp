
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
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

const CreateUserForm: React.FC<CreateUserFormProps> = ({
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
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={e => onFieldChange('password', e.target.value)}
          placeholder="Senha temporária"
          className={validationErrors.password ? 'border-red-500' : ''}
        />
        {validationErrors.password && (
          <p className="text-sm text-red-500">{validationErrors.password}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile">Perfil de Acesso</Label>
        <Select value={form.profile} onValueChange={profile => onFieldChange('profile', profile)}>
          <SelectTrigger>
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
        {validationErrors.profile && (
          <p className="text-sm text-red-500">{validationErrors.profile}</p>
        )}
      </div>
      <Button onClick={onSubmit} disabled={loading} className="w-full">
        {loading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : "Criar Usuário"}
      </Button>
    </div>
  );
};

export default CreateUserForm;
