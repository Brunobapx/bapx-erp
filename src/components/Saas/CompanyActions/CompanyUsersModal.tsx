
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Company } from "@/types/saas";
import { CompanyUsersModalContent } from "../CompanyUsersModalContent";

interface CompanyUsersModalProps {
  company: Company | null;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

export const CompanyUsersModal: React.FC<CompanyUsersModalProps> = ({ company, onOpenChange, onUserCreated }) => {
  if (!company) return null;

  return (
    <Dialog open={!!company} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Usuários da Empresa: {company.name}</DialogTitle>
        </DialogHeader>
        <CompanyUsersModalContent
          companyId={company.id}
          onUserCreated={onUserCreated}
        />
      </DialogContent>
    </Dialog>
  );
};
