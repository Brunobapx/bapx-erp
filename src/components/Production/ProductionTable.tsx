
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2, Loader2, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Production } from '@/types/production';

type ProductionTableProps = {
  filteredItems: Production[];
  loading: boolean;
  onItemClick: (item: Production) => void;
  onViewItem: (e: React.MouseEvent, item: Production) => void;
  onEditItem: (e: React.MouseEvent, item: Production) => void;
  onDeleteItem: (e: React.MouseEvent, item: Production) => void;
  onSendToPackaging: (e: React.MouseEvent, item: Production) => void;
  canSendToPackaging: (item: Production) => boolean;
};

export const ProductionTable = ({
  filteredItems,
  loading,
  onItemClick,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onSendToPackaging,
  canSendToPackaging
}: ProductionTableProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produção</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd Solicitada</TableHead>
                <TableHead className="text-center">Qtd Produzida</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Conclusão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => onItemClick(item)}
                >
                  <TableCell className="font-medium">{item.production_number}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell className="text-center">{item.quantity_requested}</TableCell>
                  <TableCell className="text-center">{item.quantity_produced || 0}</TableCell>
                  <TableCell>{formatDate(item.start_date)}</TableCell>
                  <TableCell>{formatDate(item.completion_date)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => onViewItem(e, item)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => onEditItem(e, item)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canSendToPackaging(item) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100" 
                          onClick={(e) => onSendToPackaging(e, item)}
                          title="Enviar para Embalagem"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                        onClick={(e) => onDeleteItem(e, item)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filteredItems.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma produção encontrada.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
