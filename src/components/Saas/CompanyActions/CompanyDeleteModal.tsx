
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Company } from "@/types/saas";

interface CompanyDeleteModalProps {
  company: Company | null;
  isDeleting: boolean;
  onDelete: (company: Company) => void;
  onOpenChange: (open: boolean) => void;
}

export const CompanyDeleteModal: React.FC<CompanyDeleteModalProps> = ({
  company,
  isDeleting,
  onDelete,
  onOpenChange,
}) => {
  if (!company) return null;

  const handleDeleteClick = () => {
    if (company) {
      onDelete(company);
    }
  };

  return (
    <Dialog open={!!company} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="font-bold text-destructive">Atenção!</span><br />
            Essa ação <b>não pode ser desfeita</b>.<br />
            Todos os dados da empresa e históricos relacionados serão <b>excluídos de forma definitiva!</b><br />
            Tem certeza que deseja prosseguir com a exclusão da empresa <b>{company.name}</b>?
          </div>
          {isDeleting && <div className="text-xs text-muted-foreground mt-2">Excluindo... Aguarde.</div>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isDeleting}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteClick} disabled={isDeleting}>
            Excluir definitivamente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
