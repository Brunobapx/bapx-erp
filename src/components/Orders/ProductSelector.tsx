
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from '@/hooks/useProducts';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  selectedProductName: string;
  onProductSelect: (productId: string, productName: string, productPrice?: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products = [],
  selectedProductId,
  selectedProductName,
  onProductSelect,
  open,
  setOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Initialize with empty array if products is undefined
  const safeProducts = Array.isArray(products) ? products : [];
  
  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Update filtered products when search query or products change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(safeProducts);
    } else {
      const filtered = safeProducts.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, safeProducts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
        >
          {selectedProductName || "Selecione um produto"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Buscar produto..." 
              onValueChange={setSearchQuery}
              value={searchQuery}
              className="h-9 focus:outline-none"
            />
          </div>
          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => {
                  onProductSelect(product.id, product.name, product.price);
                  setSearchQuery('');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedProductId === product.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{product.name}</span>
                  <div className="flex text-xs gap-3 text-muted-foreground">
                    <span>{product.code}</span>
                    <span>{formatCurrency(product.price)}</span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
