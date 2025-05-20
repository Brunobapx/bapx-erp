
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductsFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  sortOrder: string;
  onSortChange: (sort: string) => void;
  categories: string[];
}

export const ProductsFilter = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  sortOrder,
  onSortChange,
  categories
}: ProductsFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {categoryFilter} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category} 
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {sortOrder} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSortChange('Nome (A-Z)')}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('Nome (Z-A)')}>Nome (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('Preço (Maior)')}>Preço (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('Preço (Menor)')}>Preço (Menor)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('Estoque (Maior)')}>Estoque (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('Estoque (Menor)')}>Estoque (Menor)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
