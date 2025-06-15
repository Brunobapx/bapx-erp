
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { CreateUserFormState, CreateUserFormValidationErrors } from "./useCreateUserForm";

interface RoleOption {
  value: string;
  label: string;
  masterOnly?: boolean;
}

interface CreateUserFormProps {
  form: CreateUserFormState;
  validationErrors: CreateUserFormValidationErrors;
  loading: boolean;
  availableRoles: RoleOption[];
  userRole: string;
  onFieldChange: (field: keyof CreateUserFormState, value: string) => void;
  onSubmit: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  form,
  validationErrors,
  loading,
  availableRoles,
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
        <Label htmlFor="role">Função</Label>
        <Select value={form.role} onValueChange={role => onFieldChange('role', role)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map(role =>
              role.value === 'master' && userRole !== 'master' ? null : (
                <SelectItem value={role.value} key={role.value}>
                  {role.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
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
