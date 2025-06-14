
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pencil, Trash2, Eye, User, Calendar } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSaasCompanyManagement } from "@/hooks/useSaasCompanyManagement";
import { useToast } from "@/hooks/use-toast";

// Helper para garantir que as infos principais estejam presentes
const getCompanyPlanInfo = (company: any) => {
  const sub = Array.isArray(company.company_subscriptions) ? company.company_subscriptions.find((s:any)=>s.status==="active") : null;
  return {
    vencimento: sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR") : "",
    plano: sub?.plan_name || "",
    isExpired: sub?.expires_at ? new Date(sub.expires_at) < new Date() : false,
  };
};

export const SaasCompanyTable: React.FC<{
  companies: any[];
  loading: boolean;
  onConfig: (company: any) => void;
}> = ({ companies, loading, onConfig }) => {
  // Modals para ações
  const [viewModal, setViewModal] = useState<any | null>(null);
  const [usersModal, setUsersModal] = useState<any | null>(null);
  const [planModal, setPlanModal] = useState<any | null>(null);
  const [deleteModal, setDeleteModal] = useState<any | null>(null);

  const { deleteCompany } = useSaasCompanyManagement();
  const { toast } = useToast();

  const handleDelete = async (company: any) => {
    try {
      await deleteCompany(company.id);
      toast({ title: "Empresa excluída!", description: `Empresa "${company.name}" foi removida.`, variant: "default" });
      setDeleteModal(null);
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir a empresa.", variant: "destructive" });
    }
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
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
                  <TableCell>{planInfo.plano || "-"}</TableCell>
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
                      <Button size="sm" variant="outline" title="Plano" onClick={() => setPlanModal(company)}>
                        <Calendar className="text-blue-500" />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuários da Empresa</DialogTitle>
            </DialogHeader>
            <div>
              <span className="text-muted-foreground">Funcionalidade de gestão de usuários em breve.</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Plano */}
        <Dialog open={!!planModal} onOpenChange={v => !v && setPlanModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assinatura/Plano</DialogTitle>
            </DialogHeader>
            <div>
              <span className="text-muted-foreground">Gestão de plano da empresa em breve.</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Excluir */}
        <Dialog open={!!deleteModal} onOpenChange={v => !v && setDeleteModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Empresa</DialogTitle>
            </DialogHeader>
            <div>
              Tem certeza que deseja excluir a empresa <b>{deleteModal?.name}</b>?
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteModal)}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
};
