import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePen, ChevronDown, Search, FileText, Printer } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import FiscalEmissionHeader from "@/components/FiscalEmission/FiscalEmissionHeader";
import FiscalEmissionFilters from "@/components/FiscalEmission/FiscalEmissionFilters";
import FiscalEmissionTableSection from "@/components/FiscalEmission/FiscalEmissionTableSection";
import useFiscalEmissionFilters from "@/hooks/useFiscalEmissionFilters";

const FiscalEmissionPage = () => {
  const {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    orderSort, setOrderSort,
    filteredInvoices,
    handleEmitInvoice,
    handleCreateInvoice,
    formatCurrency
  } = useFiscalEmissionFilters();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <FiscalEmissionHeader onCreate={handleCreateInvoice} />
      <FiscalEmissionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        orderSort={orderSort}
        setOrderSort={setOrderSort}
      />
      <FiscalEmissionTableSection
        filteredInvoices={filteredInvoices}
        formatCurrency={formatCurrency}
        handleEmitInvoice={handleEmitInvoice}
      />
    </div>
  );
};

export default FiscalEmissionPage;
