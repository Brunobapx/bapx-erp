
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FinanceOverviewFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const FinanceOverviewFilters: React.FC<FinanceOverviewFiltersProps> = ({
  searchQuery,
  setSearchQuery,
}) => (
  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar lançamentos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8"
      />
    </div>
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Tipo <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Todos</DropdownMenuItem>
          <DropdownMenuItem>Receitas</DropdownMenuItem>
          <DropdownMenuItem>Despesas</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Status <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Todos</DropdownMenuItem>
          <DropdownMenuItem>Pago</DropdownMenuItem>
          <DropdownMenuItem>Pendente</DropdownMenuItem>
          <DropdownMenuItem>Aguardando Confirmação</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Ordenar <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Vencimento próximo</DropdownMenuItem>
          <DropdownMenuItem>Vencimento distante</DropdownMenuItem>
          <DropdownMenuItem>Maior valor</DropdownMenuItem>
          <DropdownMenuItem>Menor valor</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);
