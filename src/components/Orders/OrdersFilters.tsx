import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrdersFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  orderSort: string;
  setOrderSort: (sort: string) => void;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  orderSort,
  setOrderSort
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pedidos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>Ativos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Concluídos</DropdownMenuItem>
            
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Ordenar <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setOrderSort('recent')}>Mais recentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrderSort('oldest')}>Mais antigos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrderSort('client_az')}>Cliente (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrderSort('client_za')}>Cliente (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
