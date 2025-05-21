
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
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter 
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
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Ativos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Concluídos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Produção')}>
              Aguardando Produção
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Em Produção')}>
              Em Produção
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Embalagem')}>
              Aguardando Embalagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Venda')}>
              Aguardando Venda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Financeiro Pendente')}>
              Financeiro Pendente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery('Aguardando Rota')}>
              Aguardando Rota
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Ordenar <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Mais recentes</DropdownMenuItem>
            <DropdownMenuItem>Mais antigos</DropdownMenuItem>
            <DropdownMenuItem>Cliente (A-Z)</DropdownMenuItem>
            <DropdownMenuItem>Cliente (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
