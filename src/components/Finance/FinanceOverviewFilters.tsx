
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
  typeFilter?: string;
  setTypeFilter?: (type: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  sortOrder?: string;
  setSortOrder?: (sort: string) => void;
}

export const FinanceOverviewFilters: React.FC<FinanceOverviewFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  typeFilter = 'all',
  setTypeFilter = () => {},
  statusFilter = 'all',
  setStatusFilter = () => {},
  sortOrder = 'recent',
  setSortOrder = () => {},
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
          <DropdownMenuItem onClick={() => setTypeFilter('all')}>Todos</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTypeFilter('receivable')}>Receitas</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTypeFilter('payable')}>Despesas</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Status <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('paid')}>Pago</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pendente</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('overdue')}>Vencido</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Ordenar <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setSortOrder('recent')}>Mais recente</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortOrder('oldest')}>Mais antigo</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortOrder('due_near')}>Vencimento próximo</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortOrder('due_far')}>Vencimento distante</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortOrder('amount_high')}>Maior valor</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSortOrder('amount_low')}>Menor valor</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);
