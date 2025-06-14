import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ChevronDown, Search, FileText, Plus, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VendorModal } from '@/components/Modals/VendorModal';
import { useVendorsPageFilters } from '@/hooks/useVendorsPageFilters';
import { toast } from "sonner";

const VendorsPage = () => {
  // filtro centralizado para search, sort, modais, exclusão
  const {
    searchQuery,
    setSearchQuery,
    showModal,
    setShowModal,
    selectedVendor,
    setSelectedVendor,
    vendorToDelete,
    setVendorToDelete,
    isDeleting,
    handleDeleteVendor,
    loading,
    error,
    filteredVendors,
    orderSort,
    setOrderSort,
    handleModalClose,
    refreshVendors
  } = useVendorsPageFilters();

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Carregando fornecedores...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Erro ao carregar fornecedores: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <VendorsHeader onCreate={() => setShowModal(true)} orderSort={orderSort} setOrderSort={setOrderSort} />
      <VendorsTableSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredVendors={filteredVendors}
        setSelectedVendor={setSelectedVendor}
        setShowModal={setShowModal}
        setVendorToDelete={setVendorToDelete}
      />
      <VendorsModalSection
        showModal={showModal}
        setShowModal={setShowModal}
        selectedVendor={selectedVendor}
        handleModalClose={handleModalClose}
        vendorToDelete={vendorToDelete}
        setVendorToDelete={setVendorToDelete}
        handleDeleteVendor={handleDeleteVendor}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default VendorsPage;
