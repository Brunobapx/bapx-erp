
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Company } from "@/types/saas";

interface CompanyDeleteModalProps {
  company: Company | null;
  isDeleting: boolean;
  onDelete: (company: Company) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}

export const CompanyDeleteModal: React.FC<CompanyDeleteModalProps> = ({
  company,
  isDeleting,
  onDelete,
  onOpenChange,
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!company) return null;

  const handleDeleteClick = async () => {
    setError(null);
    try {
      await onDelete(company);
      // modal deve fechar em onSuccess lá no hook ou componente pai
    } catch (err: any) {
      // Tenta extrair detalhes do erro
      let msg = "Erro ao excluir empresa.";
      if (typeof err === "string") {
        msg = err;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
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
          {error && (
            <div className="text-xs text-destructive border border-destructive/40 bg-destructive/5 p-2 rounded">
              {error}
            </div>
          )}
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
