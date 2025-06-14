
import React from 'react';
import { Button } from "@/components/ui/button";
import { Company } from "@/types/saas";
import { Pencil, Trash2, Eye, User, Calendar, Power, PowerOff } from "lucide-react";

interface CompanyActionButtonsProps {
  company: Company;
  isUpdatingStatus: boolean;
  onConfig: (company: Company) => void;
  onView: (company: Company) => void;
  onUsers: (company: Company) => void;
  onToggleActive: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const CompanyActionButtons: React.FC<CompanyActionButtonsProps> = ({
  company,
  isUpdatingStatus,
  onConfig,
  onView,
  onUsers,
  onToggleActive,
  onDelete,
}) => {
  return (
    <div className="flex gap-2">
      {/* Visualizar */}
      <Button size="sm" variant="outline" title="Visualizar" onClick={() => onView(company)}>
        <Eye className="text-blue-500" />
      </Button>
      {/* Usuários */}
      <Button size="sm" variant="outline" title="Usuários" onClick={() => onUsers(company)}>
        <User className="text-blue-500" />
      </Button>
      {/* Plano e Configurações */}
      <Button size="sm" variant="outline" title="Plano e Configurações" onClick={() => onConfig(company)}>
        <Calendar className="text-blue-500" />
      </Button>
      {/* Ativar/Desativar */}
      <Button size="sm" variant="outline" title={company.is_active ? "Desativar" : "Ativar"} onClick={() => onToggleActive(company)} disabled={isUpdatingStatus}>
        {company.is_active ? <PowerOff className="text-red-500" /> : <Power className="text-green-500" />}
      </Button>
      {/* Editar */}
      <Button size="sm" variant="ghost" title="Editar" onClick={() => onConfig(company)}>
        <Pencil className="text-blue-500" />
      </Button>
      {/* Excluir */}
      <Button size="sm" variant="ghost" title="Excluir" onClick={() => onDelete(company)}>
        <Trash2 className="text-blue-500" />
      </Button>
    </div>
  );
};
