
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
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from '@/hooks/useProducts';

interface ExtendedProduct extends Product {
  displayName?: string;
}

interface ProductSelectorProps {
  products: ExtendedProduct[];
  selectedProductId: string;
  selectedProductName: string;
  onProductSelect: (productId: string, productName: string, productPrice?: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products = [],
  selectedProductId = '',
  selectedProductName = '',
  onProductSelect,
  open = false,
  setOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure products is always a valid array
  const safeProducts: ExtendedProduct[] = Array.isArray(products) ? products : [];

  // Debug logging
  useEffect(() => {
    console.log('ProductSelector - Debug info:', {
      productsCount: safeProducts.length,
      selectedProductId,
      selectedProductName,
      searchQuery,
      open
    });
  }, [safeProducts.length, selectedProductId, selectedProductName, searchQuery, open]);

  // Filter products based on search query
  const filteredProducts = safeProducts.filter(product => {
    if (!product) return false;
    
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }
    
    const searchString = searchQuery.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchString)) ||
      (product.code && product.code.toLowerCase().includes(searchString)) ||
      (product.sku && product.sku.toLowerCase().includes(searchString)) ||
      (product.ncm && product.ncm.toLowerCase().includes(searchString)) ||
      (product.category && product.category.toLowerCase().includes(searchString))
    );
  });

  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    console.log('ProductSelector - selecting product', { productId, productName });
    onProductSelect(productId, productName, productPrice);
    setSearchQuery('');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('ProductSelector - open state changing to:', newOpen);
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
          className="justify-between w-full min-h-[40px] text-left"
        >
          <span className="truncate">
            {selectedProductName || "Buscar produto..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 z-50 bg-white" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Digite para buscar produto..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9 focus:outline-none border-0"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {safeProducts.length === 0 
                ? "Nenhum produto cadastrado. Cadastre um produto primeiro." 
                : "Nenhum produto encontrado com esse termo."}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredProducts.map((product) => {
                if (!product || !product.id) return null;
                
                return (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleProductSelect(product.id, product.name || '', product.price)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProductId === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">
                        {product.displayName || product.name || 'Nome não informado'}
                      </span>
                      <div className="flex text-xs gap-3 text-muted-foreground">
                        {product.code && <span>Código: {product.code}</span>}
                        {product.price && <span>{formatCurrency(product.price)}</span>}
                        {product.stock !== undefined && (
                          <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            Estoque: {product.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
