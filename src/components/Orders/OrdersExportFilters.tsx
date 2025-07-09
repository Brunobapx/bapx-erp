import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarIcon, Download } from 'lucide-react';
import { Order } from '@/hooks/useOrders';

interface OrdersExportFiltersProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectedOrdersChange: (orderIds: string[]) => void;
  onExport: (filteredOrders: Order[]) => void;
  isExporting: boolean;
}

export const OrdersExportFilters: React.FC<OrdersExportFiltersProps> = ({
  orders,
  selectedOrders,
  onSelectedOrdersChange,
  onExport,
  isExporting
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [exportType, setExportType] = useState<'selected' | 'filtered' | 'all'>('all');

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      onSelectedOrdersChange([]);
    } else {
      onSelectedOrdersChange(orders.map(order => order.id));
    }
  };

  const getFilteredOrders = () => {
    let filteredOrders = orders;

    // Filtrar por data
    if (startDate || endDate) {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        if (startDate && orderDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (orderDate > endOfDay) return false;
        }
        return true;
      });
    }

    return filteredOrders;
  };

  const handleExport = () => {
    let ordersToExport: Order[] = [];

    switch (exportType) {
      case 'selected':
        ordersToExport = orders.filter(order => selectedOrders.includes(order.id));
        break;
      case 'filtered':
        ordersToExport = getFilteredOrders();
        break;
      case 'all':
      default:
        ordersToExport = orders;
        break;
    }

    onExport(ordersToExport);
  };

  const filteredOrders = getFilteredOrders();
  const selectedCount = selectedOrders.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Filtros de Exportação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros de Data */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Filtrar por Data de Criação</Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                Data Inicial
              </Label>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="Selecionar data inicial"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                Data Final
              </Label>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="Selecionar data final"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} pedidos encontrados no período
            </p>
          )}
        </div>

        {/* Seleção de Pedidos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Seleção de Pedidos</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={orders.length === 0}
            >
              {selectedOrders.length === orders.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </Button>
          </div>
          {selectedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedCount} pedido{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tipo de Exportação */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">O que exportar?</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-all"
                checked={exportType === 'all'}
                onCheckedChange={() => setExportType('all')}
              />
              <Label htmlFor="export-all" className="text-sm">
                Todos os pedidos ({orders.length})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-filtered"
                checked={exportType === 'filtered'}
                onCheckedChange={() => setExportType('filtered')}
                disabled={!startDate && !endDate}
              />
              <Label htmlFor="export-filtered" className="text-sm">
                Pedidos filtrados por data ({filteredOrders.length})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-selected"
                checked={exportType === 'selected'}
                onCheckedChange={() => setExportType('selected')}
                disabled={selectedCount === 0}
              />
              <Label htmlFor="export-selected" className="text-sm">
                Pedidos selecionados ({selectedCount})
              </Label>
            </div>
          </div>
        </div>

        {/* Botão de Exportação */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? 'Exportando...' : 'Exportar Pedidos'}
        </Button>
      </CardContent>
    </Card>
  );
};