
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { BadgeCheck } from "lucide-react";
import { useDeleteCompany, useUpdateCompany } from "@/hooks/useCompanyMutations";
import { CompanyCreateModal } from "./CompanyCreateModal";
import { Company } from "@/types/saas";
import { CompanyActionButtons } from "./CompanyActions/CompanyActionButtons";
import { CompanyViewModal } from "./CompanyActions/CompanyViewModal";
import { CompanyUsersModal } from "./CompanyActions/CompanyUsersModal";
import { CompanyDeleteModal } from "./CompanyActions/CompanyDeleteModal";
import { getCompanyPlanInfo } from "./CompanyUtils";

export const SaasCompaniesTab: React.FC<{
  companies: Company[];
  loading: boolean;
  onConfig: (company: Company) => void;
}> = ({ companies, loading, onConfig }) => {
  const [viewModal, setViewModal] = useState<Company | null>(null);
  const [usersModal, setUsersModal] = useState<Company | null>(null);
  const [deleteModal, setDeleteModal] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();
  const { mutate: updateCompany, isPending: isUpdatingStatus } = useUpdateCompany();

  const handleDelete = (company: Company) => {
    deleteCompany(company.id, {
        onSuccess: () => {
            setDeleteModal(null);
        }
    })
  };

  const handleToggleActive = (company: Company) => {
    updateCompany({ id: company.id, formData: { is_active: !company.is_active } });
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Empresas</h3>
        <CompanyCreateModal open={modalOpen} setOpen={setModalOpen} />
      </div>
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando empresas...</div>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map(company => {
              const planInfo = getCompanyPlanInfo(company);
              return (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    {company.is_active ? (
                      <BadgeCheck className="text-green-500" />
                    ) : (
                      <span className="text-xs text-red-600">Inativo</span>
                    )}
                  </TableCell>
                  <TableCell>{company.whatsapp || ""}</TableCell>
                  <TableCell>{company.billing_email || "-"}</TableCell>
                  <TableCell>
                    {planInfo.vencimento ? (
                      <span className={planInfo.isExpired ? "bg-red-500 text-white px-2 rounded py-1" : ""}>
                        {planInfo.vencimento}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{planInfo.plano}</TableCell>
                  <TableCell>
                    <CompanyActionButtons 
                        company={company}
                        isUpdatingStatus={isUpdatingStatus}
                        onConfig={onConfig}
                        onView={setViewModal}
                        onUsers={setUsersModal}
                        onToggleActive={handleToggleActive}
                        onDelete={setDeleteModal}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <CompanyViewModal company={viewModal} onOpenChange={() => setViewModal(null)} />
        <CompanyUsersModal company={usersModal} onOpenChange={() => setUsersModal(null)} />
        <CompanyDeleteModal company={deleteModal} isDeleting={isDeleting} onDelete={handleDelete} onOpenChange={() => setDeleteModal(null)} />

        </>
      )}
    </div>
  );
};
