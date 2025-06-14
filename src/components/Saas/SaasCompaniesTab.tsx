
import React, { useState, useMemo } from "react";
import { SaasCompanyTable } from "./SaasCompanyTable";
import { CompanyCreateModal } from "@/components/Saas/CompanyCreateModal";
import { Input } from "@/components/ui/input";
import { Building } from "lucide-react";

interface SaasCompaniesTabProps {
  companies: any[];
  loading: boolean;
  companySettingsOpen: boolean;
  setCompanySettingsOpen: (v: boolean) => void;
  onConfig: (company: any) => void;
}

export const SaasCompaniesTab: React.FC<SaasCompaniesTabProps> = ({
  companies, loading, companySettingsOpen, setCompanySettingsOpen, onConfig
}) => {
  const [search, setSearch] = useState("");

  // Filtro simples pelo nome da empresa
  const filtered = useMemo(() => {
    if (!search) return companies;
    const s = search.toLowerCase();
    return companies.filter(c =>
      (c.name || "").toLowerCase().includes(s)
    );
  }, [companies, search]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      {/* Header com ícone e título */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold">Empresas</span>
        </div>
        <CompanyCreateModal open={companySettingsOpen} setOpen={setCompanySettingsOpen} />
      </div>
      {/* Barra de busca e botão adicionar */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          placeholder="Localize"
          className="w-full max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="ml-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-base flex items-center gap-2"
          onClick={() => setCompanySettingsOpen(true)}
          type="button"
        >
          + ADICIONAR
        </button>
      </div>
      {/* Tabela de empresas */}
      <SaasCompanyTable
        companies={filtered}
        loading={loading}
        onConfig={onConfig}
      />
    </div>
  );
};
