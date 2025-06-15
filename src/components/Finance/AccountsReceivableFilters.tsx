
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "./DateRangeFilter";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

type FilterProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  period: { startDate: Date | null; endDate: Date | null };
  setPeriod: (v: { startDate: Date | null, endDate: Date | null }) => void;
  accountFilter: string;
  setAccountFilter: (v: string) => void;
  accounts: any[];
  accountsLoading: boolean;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: any[];
  categoriesLoading: boolean;
};

export const AccountsReceivableFilters: React.FC<FilterProps> = ({
  searchQuery, setSearchQuery,
  period, setPeriod,
  accountFilter, setAccountFilter, accounts, accountsLoading,
  categoryFilter, setCategoryFilter, categories, categoriesLoading,
}) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar recebimentos..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8"
      />
    </div>
    <div className="flex gap-2 items-center flex-wrap">
      <DateRangeFilter range={period} onChange={setPeriod} label="Filtrar por período" />
      {/* Conta */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[140px] flex justify-between">
            <span>{accountFilter ? accountFilter : "Conta bancária/Caixa"}</span>
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-0">
          <ul>
            <li>
              <Button
                size="sm"
                variant={!accountFilter ? "secondary" : "ghost"}
                className="w-full justify-start rounded-none"
                onClick={() => setAccountFilter("")}
                disabled={accountsLoading}
              >
                Todas
              </Button>
            </li>
            {accounts?.map(acc => (
              <li key={acc.id}>
                <Button
                  size="sm"
                  variant={accountFilter === acc.name ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-none"
                  onClick={() => setAccountFilter(acc.name)}
                  disabled={accountsLoading}
                >
                  {acc.name}
                </Button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      {/* Categoria */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[120px] flex justify-between">
            <span>{categoryFilter ? categoryFilter : "Categoria"}</span>
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-0">
          <ul>
            <li>
              <Button
                size="sm"
                variant={!categoryFilter ? "secondary" : "ghost"}
                className="w-full justify-start rounded-none"
                onClick={() => setCategoryFilter("")}
                disabled={categoriesLoading}
              >
                Todas
              </Button>
            </li>
            {categories
              ?.filter(cat => cat.type === "receita" && cat.is_active)
              .map(cat => (
                <li key={cat.id}>
                  <Button
                    size="sm"
                    variant={categoryFilter === cat.name ? "secondary" : "ghost"}
                    className="w-full justify-start rounded-none"
                    onClick={() => setCategoryFilter(cat.name)}
                    disabled={categoriesLoading}
                  >
                    {cat.name}
                  </Button>
                </li>
              ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  </div>
)
