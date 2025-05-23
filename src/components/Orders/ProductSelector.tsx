
import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
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
  products,
  selectedProductId,
  selectedProductName,
  onProductSelect,
  open,
  setOpen
}) => {
  // Garantir que products é sempre um array válido
  const safeProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      console.log("ProductSelector: products is not an array:", products);
      return [];
    }
    
    return products.filter(product => {
      if (!product || typeof product !== 'object') {
        console.log("ProductSelector: Invalid product object:", product);
        return false;
      }
      if (!product.id || !product.name) {
        console.log("ProductSelector: Product missing required fields:", product);
        return false;
      }
      return true;
    });
  }, [products]);

  // Format currency for display
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleProductSelect = (productId: string, productName: string, productPrice?: number) => {
    onProductSelect(productId, productName, productPrice);
    setOpen(false);
  };

  console.log("ProductSelector render:", {
    productsCount: safeProducts.length,
    open,
    selectedProductId: selectedProductId || '',
    selectedProductName: selectedProductName || ''
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command>
          <CommandInput 
            placeholder="Digite para buscar produto..." 
            className="h-9"
          />
          <CommandEmpty>
            {safeProducts.length === 0 
              ? "Nenhum produto cadastrado. Cadastre um produto primeiro." 
              : "Nenhum produto encontrado com esse termo."}
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {safeProducts.map((product) => {
              // Garantir que product é válido antes de renderizar
              if (!product || !product.id || !product.name) {
                console.log("Skipping invalid product:", product);
                return null;
              }

              console.log("Rendering product:", {
                id: product.id,
                name: product.name
              });

              return (
                <CommandItem
                  key={product.id}
                  value={`${product.name}-${product.id}`}
                  onSelect={() => {
                    console.log("Product selected:", product);
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
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
