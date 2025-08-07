
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Packaging } from '@/hooks/usePackaging';

type PackagingTableProps = {
  packagings: Packaging[];
  loading: boolean;
  onItemClick: (item: Packaging) => void;
  onViewItem: (e: React.MouseEvent, item: Packaging) => void;
  onEditItem: (e: React.MouseEvent, item: Packaging) => void;
  onDeleteItem: (e: React.MouseEvent, item: Packaging) => void;
  formatDate: (dateString?: string) => string;
  getStatusBadgeClass: (status: string) => string;
};

export const PackagingTable = ({
  packagings,
  loading,
  onItemClick,
  onViewItem,
  onEditItem,
  onDeleteItem,
  formatDate,
  getStatusBadgeClass
}: PackagingTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packagings.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground mb-4">
          Nenhuma embalagem encontrada
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          As embalagens são criadas automaticamente quando a produção é aprovada.
        </p>
        <p className="text-xs text-muted-foreground">
          Verifique a página de produção para aprovar itens produzidos.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Embalagem</TableHead>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead className="text-center">Qtd para Embalar</TableHead>
          <TableHead className="text-center">Qtd Embalada</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Qualidade</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packagings.map((item) => (
          <TableRow 
            key={item.id}
            className="cursor-pointer hover:bg-accent/5"
            onClick={() => onItemClick(item)}
          >
            <TableCell className="font-medium">{item.packaging_number}</TableCell>
            <TableCell>{item.order_number || 'N/A'}</TableCell>
            <TableCell>{item.client_name || 'N/A'}</TableCell>
            <TableCell>{item.product_name}</TableCell>
            <TableCell className="text-center">{item.quantity_to_package}</TableCell>
            <TableCell className="text-center">{item.quantity_packaged || 0}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
                {item.status}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.quality_check ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.quality_check ? 'Aprovado' : 'Pendente'}
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
                  title={item.status === 'approved' ? 'Já aprovado — edição bloqueada' : 'Editar'}
                  disabled={item.status === 'approved'}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100" 
                  onClick={(e) => onDeleteItem(e, item)}
                  title={item.status === 'approved' ? 'Já aprovado — exclusão bloqueada' : 'Excluir'}
                  disabled={item.status === 'approved'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
