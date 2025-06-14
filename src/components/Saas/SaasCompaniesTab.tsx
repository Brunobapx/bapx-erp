import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pencil, Trash2, Eye, User, Calendar, Power, PowerOff } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteCompany, useUpdateCompany } from "@/hooks/useCompanyMutations";
import { CompanyCreateModal } from "./CompanyCreateModal";
import { Company } from "@/types/saas";
import { CompanyUsersModalContent } from "./CompanyUsersModalContent";

// Helper para garantir que as infos principais estejam presentes
const getCompanyPlanInfo = (company: Company) => {
  const sub = Array.isArray(company.company_subscriptions) ? company.company_subscriptions.find((s:any)=>s.status==="active") : null;
  const planName = sub?.saas_plans?.name || "-";
  return {
    vencimento: sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR") : "",
    plano: planName,
    isExpired: sub?.expires_at ? new Date(sub.expires_at) < new Date() : false,
  };
};

export const SaasCompaniesTab: React.FC<{
  companies: Company[];
  loading: boolean;
  onConfig: (company: Company) => void;
}> = ({ companies, loading, onConfig }) => {
  // Modals para ações
  const [viewModal, setViewModal] = useState<Company | null>(null);
  const [usersModal, setUsersModal] = useState<Company | null>(null);
  const [deleteModal, setDeleteModal] = useState<Company | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();
  const { mutate: updateCompany, isPending: isUpdatingStatus } = useUpdateCompany();

  const handleDelete = (company: Company | null) => {
    if (!company) return;
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
                    <div className="flex gap-2">
                      {/* Visualizar */}
                      <Button size="sm" variant="outline" title="Visualizar" onClick={() => setViewModal(company)}>
                        <Eye className="text-blue-500" />
                      </Button>
                      {/* Usuários */}
                      <Button size="sm" variant="outline" title="Usuários" onClick={() => setUsersModal(company)}>
                        <User className="text-blue-500" />
                      </Button>
                      {/* Plano */}
                      <Button size="sm" variant="outline" title="Plano e Configurações" onClick={() => onConfig(company)}>
                        <Calendar className="text-blue-500" />
                      </Button>
                      {/* Ativar/Desativar */}
                      <Button size="sm" variant="outline" title={company.is_active ? "Desativar" : "Ativar"} onClick={() => handleToggleActive(company)} disabled={isUpdatingStatus}>
                        {company.is_active ? <PowerOff className="text-red-500" /> : <Power className="text-green-500" />}
                      </Button>
                      {/* Editar */}
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => onConfig(company)}>
                        <Pencil className="text-blue-500" />
                      </Button>
                      {/* Excluir */}
                      <Button size="sm" variant="ghost" title="Excluir" onClick={() => setDeleteModal(company)}>
                        <Trash2 className="text-blue-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Modal Visualizar Empresa */}
        <Dialog open={!!viewModal} onOpenChange={v => !v && setViewModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Visualizar Empresa</DialogTitle>
            </DialogHeader>
            {viewModal && (
              <div className="space-y-2">
                <div><b>Nome:</b> {viewModal.name}</div>
                <div><b>Subdomínio:</b> {viewModal.subdomain}</div>
                <div><b>Email Cobrança:</b> {viewModal.billing_email}</div>
                <div><b>Status:</b> {viewModal.is_active ? 'Ativa' : 'Inativa'}</div>
                <div><b>Vencimento:</b> {getCompanyPlanInfo(viewModal).vencimento || '-'}</div>
                <div><b>Plano:</b> {getCompanyPlanInfo(viewModal).plano || '-'}</div>
                {viewModal.logo_url && (
                  <div><img src={viewModal.logo_url} alt="Logo" className="h-16" /></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Usuários */}
        <Dialog open={!!usersModal} onOpenChange={v => !v && setUsersModal(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Usuários da Empresa: {usersModal?.name}</DialogTitle>
            </DialogHeader>
            {usersModal && <CompanyUsersModalContent companyId={usersModal.id} />}
          </DialogContent>
        </Dialog>

        {/* Modal Excluir */}
        <Dialog open={!!deleteModal} onOpenChange={v => !v && setDeleteModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <span className="font-bold text-destructive">Atenção!</span><br />
                Essa ação <b>não pode ser desfeita</b>.<br />
                Todos os dados da empresa e históricos relacionados serão <b>excluídos de forma definitiva!</b><br />
                Tem certeza que deseja prosseguir com a exclusão da empresa <b>{deleteModal?.name}</b>?
              </div>
              {isDeleting && <div className="text-xs text-muted-foreground mt-2">Excluindo... Aguarde.</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDeleteModal(null)} disabled={isDeleting}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteModal)} disabled={isDeleting}>
                Excluir definitivamente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
};
