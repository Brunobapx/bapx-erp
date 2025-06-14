
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SaasCompanyTableProps {
  companies: any[];
  loading: boolean;
  onConfig: (company: any) => void;
}

export const SaasCompanyTable: React.FC<SaasCompanyTableProps> = ({ companies, loading, onConfig }) => (
  <Card>
    <CardHeader>
      <CardTitle>Empresas</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div>Carregando empresas...</div>
      ) : (
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Subdomínio</th>
              <th>Email cobrança</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company: any) => (
              <tr key={company.id}>
                <td className="font-medium">{company.name}</td>
                <td>{company.subdomain}</td>
                <td>{company.billing_email || '-'}</td>
                <td>{company.is_active ? "Ativa" : "Inativa"}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onConfig(company)}
                  >
                    Configurar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardContent>
  </Card>
);
