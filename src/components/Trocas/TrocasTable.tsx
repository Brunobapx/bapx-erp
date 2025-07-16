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
import { Eye, FileText, AlertTriangle } from 'lucide-react';
import { Troca } from '@/hooks/useTrocas';

interface TrocasTableProps {
  trocas: Troca[];
  onViewDetails?: (troca: Troca) => void;
  onGenerateRomaneio?: (troca: Troca) => void;
}

export const TrocasTable: React.FC<TrocasTableProps> = ({
  trocas,
  onViewDetails,
  onGenerateRomaneio
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
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto Devolvido</TableHead>
              <TableHead>Produto Entregue</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Perda Estimada</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trocas.map((troca) => (
              <TableRow key={troca.id} className="hover:bg-accent/5">
                <TableCell className="font-medium">
                  {formatDate(troca.data_troca)}
                </TableCell>
                <TableCell>{troca.cliente?.name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{troca.produto_devolvido?.name}</div>
                    <Badge variant="destructive" className="text-xs">
                      Descartado
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{troca.produto_novo?.name}</TableCell>
                <TableCell>{troca.quantidade}</TableCell>
                <TableCell>
                  <Badge variant={getMotivoColor(troca.motivo)}>
                    {troca.motivo}
                  </Badge>
                </TableCell>
                <TableCell>{troca.responsavel}</TableCell>
                <TableCell>
                  {formatCurrency((troca.produto_devolvido?.cost || 0) * troca.quantidade)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
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