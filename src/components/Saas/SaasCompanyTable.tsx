
import React from "react";
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

// Helper para garantir que as infos principais estejam presentes
const getCompanyPlanInfo = (company: any) => {
  // company.company_subscriptions[0] usually is the last/active subscription
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
}> = ({ companies, loading, onConfig }) => (
  <div className="overflow-x-auto border rounded-lg">
    {loading ? (
      <div className="p-8 text-center text-muted-foreground">Carregando empresas...</div>
    ) : (
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
                <TableCell>
                  {company.whatsapp || ""}
                </TableCell>
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
                    <Button size="sm" variant="outline" title="Visualizar">
                      <Eye className="text-blue-500" />
                    </Button>
                    <Button size="sm" variant="outline" title="Usuários">
                      <User className="text-blue-500" />
                    </Button>
                    <Button size="sm" variant="outline" title="Plano">
                      <Calendar className="text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Editar" onClick={() => onConfig(company)}>
                      <Pencil className="text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Excluir">
                      <Trash2 className="text-blue-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )}
  </div>
);
