
import React from "react";
import { SaasCompanyTable } from "./SaasCompanyTable";
import { CompanyCreateModal } from "@/components/Saas/CompanyCreateModal";

interface SaasCompaniesTabProps {
  companies: any[];
  loading: boolean;
  companySettingsOpen: boolean;
  setCompanySettingsOpen: (v: boolean) => void;
  onConfig: (company: any) => void;
}

export const SaasCompaniesTab: React.FC<SaasCompaniesTabProps> = ({
  companies, loading, companySettingsOpen, setCompanySettingsOpen, onConfig
}) => (
  <div>
    <div className="flex justify-end mb-4">
      <CompanyCreateModal open={companySettingsOpen} setOpen={setCompanySettingsOpen} />
    </div>
    <SaasCompanyTable
      companies={companies}
      loading={loading}
      onConfig={onConfig}
    />
  </div>
);
