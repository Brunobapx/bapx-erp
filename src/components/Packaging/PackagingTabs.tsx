
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PackagingFilters } from "./PackagingFilters";
import { PackagingTable } from "./PackagingTable";
import { PackagingSummaryTable } from "./PackagingSummaryTable";

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (f: string) => void;
  orderSort: string;
  setOrderSort: (o: string) => void;
  filteredItems: any[];
  loading: boolean;
  formatDate: (date?: string) => string;
  getStatusBadgeClass: (status: string) => string;
  handleItemClick: (item: any) => void;
  handleViewItem: (e: any, item: any) => void;
  handleEditItem: (e: any, item: any) => void;
  handleDeleteItem: (e: any, item: any) => void;
  packagingSummary: any[];
};

const PackagingTabs = ({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  orderSort, setOrderSort, filteredItems,
  loading, formatDate, getStatusBadgeClass,
  handleItemClick, handleViewItem, handleEditItem,
  handleDeleteItem, packagingSummary
}: Props) => (
  <Tabs defaultValue="list" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="list">Lista de Embalagens</TabsTrigger>
      <TabsTrigger value="summary">Resumo da Embalagem</TabsTrigger>
    </TabsList>
    <TabsContent value="list" className="space-y-4">
      <PackagingFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        orderSort={orderSort}
        setOrderSort={setOrderSort}
      />
      <Card>
        <CardContent className="p-0">
          <PackagingTable
            packagings={filteredItems}
            loading={loading}
            onItemClick={handleItemClick}
            onViewItem={handleViewItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            formatDate={formatDate}
            getStatusBadgeClass={getStatusBadgeClass}
          />
        </CardContent>
      </Card>
    </TabsContent>
    <TabsContent value="summary" className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <PackagingSummaryTable summary={packagingSummary} />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

export default PackagingTabs;
