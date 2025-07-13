import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

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
  const { isSeller, user } = useAuth();

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`
    };
  };

  // Função para buscar nome do vendedor
  const getSellerName = async (userId: string): Promise<string> => {
    try {
      // Tentar buscar em pedidos existentes primeiro
      const { data: orderData } = await supabase
        .from('orders')
        .select('seller')
        .eq('salesperson_id', userId)
        .not('seller', 'is', null)
        .limit(1)
        .single();

      if (orderData?.seller && orderData.seller !== 'N/A') {
        return orderData.seller;
      }

      // Fallback para email do usuário
      return user?.email || 'Vendedor';
    } catch (error) {
      console.error('Erro ao buscar nome do vendedor:', error);
      return user?.email || 'Vendedor';
    }
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

  // Preencher automaticamente o nome do vendedor se for vendedor
  useEffect(() => {
    if (isSeller && user?.id) {
      const loadSellerName = async () => {
        const sellerName = await getSellerName(user.id);
        onFiltersChange({ 
          sellerId: user.id, 
          sellerName: sellerName 
        });
      };
      loadSellerName();
    }
  }, [isSeller, user?.id]);

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
            placeholder={isSeller ? "Seu nome será preenchido automaticamente" : "Nome do vendedor"}
            value={filters.sellerName}
            onChange={(e) => onFiltersChange({ sellerName: e.target.value, sellerId: '' })}
            disabled={isSeller}
            className={isSeller ? "opacity-60 cursor-not-allowed" : ""}
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
      
      {isSeller && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            🔒 Como vendedor, você visualiza apenas suas próprias comissões por motivos de segurança
          </p>
        </div>
      )}
    </div>
  );
};