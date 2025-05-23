
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

  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    onProductSelect(productId, productName, productPrice);
    setSearchQuery('');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full text-left"
        >
          <span className="truncate">
            {selectedProductName || "Buscar produto..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Digite para buscar produto..." 
              onValueChange={setSearchQuery}
              value={searchQuery}
              className="h-9 focus:outline-none border-0"
            />
          </div>
          <CommandEmpty>
            {safeProducts.length === 0 
              ? "Nenhum produto cadastrado. Cadastre um produto primeiro." 
              : "Nenhum produto encontrado com esse termo."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => {
                  handleProductSelect(product.id, product.name, product.price);
                }}
                className="cursor-pointer"
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
                    {product.code && <span>Código: {product.code}</span>}
                    {product.price && <span>{formatCurrency(product.price)}</span>}
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
