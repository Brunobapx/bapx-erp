import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Troca } from '@/hooks/useTrocas';

interface TrocasTableProps {
  trocas: Troca[];
  onViewDetails?: (troca: Troca) => void;
  onGenerateRomaneio?: (troca: Troca) => void;
  onFinalizarTroca?: (troca: Troca) => void;
}

export const TrocasTable: React.FC<TrocasTableProps> = ({
  trocas,
  onViewDetails,
  onGenerateRomaneio,
  onFinalizarTroca
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMotivoColor = (motivo: string) => {
    switch (motivo.toLowerCase()) {
      case 'produto vencido':
        return 'destructive';
      case 'produto mofado':
        return 'destructive';
      case 'produto estragado':
        return 'destructive';
      case 'defeito de fabricação':
        return 'secondary';
      case 'embalagem danificada':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'finalizada':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Finalizada</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  const calcularQuantidadeTotal = (troca: Troca) => {
    return troca.troca_itens?.reduce((acc, item) => acc + item.quantidade, 0) || 0;
  };

  const calcularCustoTotal = (troca: Troca) => {
    return troca.troca_itens?.reduce((acc, item) => {
      const custo = item.produto_devolvido?.cost || 0;
      return acc + (custo * item.quantidade);
    }, 0) || 0;
  };

  if (trocas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma troca registrada</h3>
          <p className="text-muted-foreground">
            Quando houver trocas de produtos, elas aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Qtd Total</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Perda Estimada</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trocas.map((troca) => (
              <TableRow key={troca.id} className="hover:bg-accent/5">
                <TableCell className="font-medium">
                  <Badge variant="outline">{troca.numero_troca}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatDate(troca.data_troca)}
                </TableCell>
                <TableCell>{troca.cliente?.name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {troca.troca_itens?.map((item, index) => (
                      <div key={item.id} className="text-sm">
                        <div className="font-medium">
                          {item.produto_devolvido?.name} → {item.produto_novo?.name}
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {item.quantidade} unidades
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{calcularQuantidadeTotal(troca)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {troca.troca_itens?.map(item => (
                      <Badge key={item.id} variant="outline" className="mr-1">
                        {item.motivo}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{troca.responsavel}</TableCell>
                <TableCell>
                  {getStatusBadge((troca as any).status)}
                </TableCell>
                <TableCell>
                  {formatCurrency(calcularCustoTotal(troca))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onViewDetails && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(troca)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onGenerateRomaneio && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGenerateRomaneio(troca)}
                        title="Gerar romaneio"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {onFinalizarTroca && (troca as any).status !== 'finalizada' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onFinalizarTroca(troca)}
                        title="Finalizar troca"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};