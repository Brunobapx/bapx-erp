
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompanySubscriptions } from '@/hooks/useCompanySubscriptions';
import { CreditCard, Eye } from 'lucide-react';

export const SaasSubscriptionsManagement = () => {
  const { subscriptions, loading } = useCompanySubscriptions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativa</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspensa</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Gestão de Assinaturas</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando assinaturas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Auto Renovação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      {subscription.companies?.name}
                    </TableCell>
                    <TableCell>{subscription.saas_plans?.name}</TableCell>
                    <TableCell>
                      R$ {subscription.saas_plans?.price?.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>
                      {new Date(subscription.starts_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {subscription.expires_at 
                        ? new Date(subscription.expires_at).toLocaleDateString('pt-BR')
                        : 'Sem expiração'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.auto_renew ? 'default' : 'outline'}>
                        {subscription.auto_renew ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
