
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface FormData {
  name: string;
  description: string;
  is_admin: boolean;
  is_active: boolean;
}

interface ProfileFormFieldsProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
  isMasterProfile: boolean;
}

export const ProfileFormFields = ({ 
  formData, 
  onFormDataChange, 
  isMasterProfile 
}: ProfileFormFieldsProps) => {
  const handleAdminChange = (checked: boolean | string) => {
    const isAdmin = checked === true;
    console.log('Admin status changed:', isAdmin);
    onFormDataChange({ is_admin: isAdmin });
  };

  const handleActiveChange = (checked: boolean | string) => {
    const isActive = checked === true;
    console.log('Active status changed:', isActive);
    onFormDataChange({ is_active: isActive });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Perfil</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            placeholder="Nome do perfil"
            required
            disabled={isMasterProfile}
          />
        </div>
        <div className="space-y-2 flex items-center gap-2">
          <Checkbox
            id="is_admin"
            checked={formData.is_admin}
            onCheckedChange={handleAdminChange}
            disabled={isMasterProfile}
          />
          <Label htmlFor="is_admin">Perfil Administrativo</Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={handleActiveChange}
            disabled={isMasterProfile}
          />
          <Label htmlFor="is_active">Perfil Ativo</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          placeholder="Descrição do perfil"
          rows={3}
          disabled={isMasterProfile}
        />
      </div>
    </>
  );
};
