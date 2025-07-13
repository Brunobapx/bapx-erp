import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface CommissionFilters {
  startDate: string;
  endDate: string;
  sellerId: string;
  sellerName: string;
}

interface CommissionFiltersProps {
  filters: CommissionFilters;
  onFiltersChange: (filters: Partial<CommissionFilters>) => void;
}

export const CommissionFilters: React.FC<CommissionFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const { userRole, user } = useAuth();
  
  // Se for vendedor, só pode ver suas próprias comissões
  const isSellerRestricted = userRole === 'seller';

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`
    };
  };

  const setCurrentMonth = () => {
    const { start, end } = getCurrentMonth();
    onFiltersChange({ startDate: start, endDate: end });
  };

  const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
    const lastDay = new Date(year, lastMonth.getMonth() + 1, 0).getDate();
    
    onFiltersChange({
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${lastDay}`
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ startDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data Final</Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ endDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sellerName">Vendedor</Label>
          <Input
            id="sellerName"
            placeholder="Nome do vendedor"
            value={isSellerRestricted ? user?.email || '' : filters.sellerName}
            onChange={(e) => onFiltersChange({ sellerName: e.target.value, sellerId: '' })}
            disabled={isSellerRestricted}
            className={isSellerRestricted ? "opacity-60 cursor-not-allowed" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Período</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={setCurrentMonth}>
              Mês Atual
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              Mês Anterior
            </Button>
          </div>
        </div>
      </div>
      
      {isSellerRestricted && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            📊 Visualizando apenas suas comissões como vendedor
          </p>
        </div>
      )}
    </div>
  );
};