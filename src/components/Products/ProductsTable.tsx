
import React from 'react';
import { Barcode, Factory } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  name: string;
  code?: string;
  ncm?: string;
  price?: number;
  cost?: number;
  stock?: number;
  unit?: string;
  category?: string;
  is_manufactured?: boolean;
  sku?: string;
}

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onProductClick: (product: Product) => void;
  formatCurrency: (value: number) => string;
}

export const ProductsTable = ({ products, isLoading, onProductClick, formatCurrency }: ProductsTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center">Carregando produtos...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>NCM</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Un.</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fabricado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => onProductClick(product)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      {product.code}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.ncm}</TableCell>
                    <TableCell>{product.price ? formatCurrency(product.price) : '-'}</TableCell>
                    <TableCell>{product.cost ? formatCurrency(product.cost) : '-'}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      {product.category && (
                        <span className="stage-badge badge-packaging">
                          {product.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.is_manufactured && (
                        <div className="flex justify-center">
                          <Factory className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
