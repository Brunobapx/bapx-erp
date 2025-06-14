
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  orderSort: string;
  setOrderSort: (v: string) => void;
};

const FiscalEmissionFilters = ({
  searchQuery, setSearchQuery, typeFilter, setTypeFilter,
  statusFilter, setStatusFilter, orderSort, setOrderSort
}: Props) => (
  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar notas fiscais..."
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
          <DropdownMenuItem onClick={() => setTypeFilter('NFe')}>NFe</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTypeFilter('NFCe')}>NFCe</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTypeFilter('CTe')}>CTe</DropdownMenuItem>
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
          <DropdownMenuItem onClick={() => setStatusFilter('Autorizada')}>Autorizada</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('Pendente')}>Pendente</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('Cancelada')}>Cancelada</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatusFilter('Rejeitada')}>Rejeitada</DropdownMenuItem>
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
          <DropdownMenuItem onClick={() => setOrderSort('oldest')}>Mais antigas</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOrderSort('greater')}>Maior valor</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOrderSort('less')}>Menor valor</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

export default FiscalEmissionFilters;
