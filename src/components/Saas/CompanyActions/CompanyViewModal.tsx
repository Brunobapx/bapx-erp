
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Company } from "@/types/saas";
import { getCompanyPlanInfo } from '../CompanyUtils';

interface CompanyViewModalProps {
  company: Company | null;
  onOpenChange: (open: boolean) => void;
}

export const CompanyViewModal: React.FC<CompanyViewModalProps> = ({ company, onOpenChange }) => {
  if (!company) return null;
  const planInfo = getCompanyPlanInfo(company);

  return (
    <Dialog open={!!company} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Visualizar Empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div><b>Nome:</b> {company.name}</div>
          <div><b>Subdomínio:</b> {company.subdomain}</div>
          <div><b>Email Cobrança:</b> {company.billing_email}</div>
          <div><b>Status:</b> {company.is_active ? 'Ativa' : 'Inativa'}</div>
          <div><b>Vencimento:</b> {planInfo.vencimento || '-'}</div>
          <div><b>Plano:</b> {planInfo.plano || '-'}</div>
          {company.logo_url && (
            <div><img src={company.logo_url} alt="Logo" className="h-16" /></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
