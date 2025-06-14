
import React from "react";
import { useCommissions } from "@/hooks/useCommissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CommissionsPage = () => {
  const { commissions, loading, payCommission } = useCommissions();

  const handleMarkPaid = async (id: string) => {
    await payCommission(id);
  };

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Comissões de Vendas</h1>
      <p className="text-muted-foreground mb-2">Acompanhe o status das comissões e marque pagamentos.</p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Carregando...</TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>Nenhuma comissão encontrada.</TableCell>
                </TableRow>
              ) : (
                commissions.map((com) => (
                  <TableRow key={com.id}>
                    <TableCell>{com.sale_number}</TableCell>
                    <TableCell>{com.client_name}</TableCell>
                    <TableCell>{com.salesperson_id}</TableCell>
                    <TableCell>R$ {com.total_amount?.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      {com.commission_type === "percent"
                        ? `${com.commission_rate}% (R$ ${com.commission_value?.toLocaleString("pt-BR")})`
                        : `R$ ${com.commission_value?.toLocaleString("pt-BR")}`}
                    </TableCell>
                    <TableCell>
                      {com.is_paid
                        ? <span className="text-green-600 font-semibold">Paga</span>
                        : <span className="text-yellow-700 font-semibold">Pendente</span>
                      }
                    </TableCell>
                    <TableCell>
                      {!com.is_paid && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(com.id)}>
                          Marcar como paga
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsPage;
