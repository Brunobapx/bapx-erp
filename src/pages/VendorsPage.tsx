
import React from 'react';
import VendorsHeader from "@/components/Vendors/VendorsHeader";
import VendorsTableSection from "@/components/Vendors/VendorsTableSection";
import VendorsModalSection from "@/components/Vendors/VendorsModalSection";
import useVendorsPageFilters from '@/hooks/useVendorsPageFilters';

const VendorsPage = () => {
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
