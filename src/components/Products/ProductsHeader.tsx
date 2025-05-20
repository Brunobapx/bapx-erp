
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Plus } from 'lucide-react';

interface ProductsHeaderProps {
  onNewProduct: () => void;
}

export const ProductsHeader = ({ onNewProduct }: ProductsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Produtos</h1>
        <p className="text-muted-foreground">Cadastro e gerenciamento de produtos.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={onNewProduct} 
          className="bg-erp-packaging hover:bg-erp-packaging/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Catálogo Fiscal
        </Button>
      </div>
    </div>
  );
};
