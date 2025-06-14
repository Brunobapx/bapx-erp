import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalModal } from '@/components/Modals/ApprovalModal';
import { Package } from 'lucide-react';
import StageAlert from '@/components/Alerts/StageAlert';
import { usePackaging } from '@/hooks/usePackaging';
import { usePackagingFilters } from '@/hooks/usePackagingFilters';
import { usePackagingSummary } from '@/hooks/usePackagingSummary';
import { PackagingFilters } from '@/components/Packaging/PackagingFilters';
import { PackagingTable } from '@/components/Packaging/PackagingTable';
import { PackagingSummaryTable } from '@/components/Packaging/PackagingSummaryTable';
import PackagingHeader from "@/components/Packaging/PackagingHeader";
import PackagingTabs from "@/components/Packaging/PackagingTabs";
import PackagingApprovalModal from "@/components/Packaging/PackagingApprovalModal";
import usePackagingPageFilters from "@/hooks/usePackagingPageFilters";

const PackagingPage = () => {
  // use filtro unificado dedicado
  const {
    searchQuery,
    setSearchQuery,
    showModal,
    selectedItem,
    statusFilter,
    setStatusFilter,
    orderSort,
    setOrderSort,
    alerts,
    setShowModal,
    setSelectedItem,
    setAlerts,
    filteredItems,
    loading,
    handleCreatePackaging,
    handleItemClick,
    handleViewItem,
    handleEditItem,
    handleDeleteItem,
    handleDismissAlert,
    handleApprovePackaging,
    handleNextStage,
    handleModalClose,
    packagingSummary,
    formatDate,
    getStatusBadgeClass
  } = usePackagingPageFilters();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PackagingHeader onCreate={handleCreatePackaging} />
      <StageAlert alerts={alerts} onDismiss={handleDismissAlert} />
      <PackagingTabs
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        orderSort={orderSort}
        setOrderSort={setOrderSort}
        filteredItems={filteredItems}
        loading={loading}
        formatDate={formatDate}
        getStatusBadgeClass={getStatusBadgeClass}
        handleItemClick={handleItemClick}
        handleViewItem={handleViewItem}
        handleEditItem={handleEditItem}
        handleDeleteItem={handleDeleteItem}
        packagingSummary={packagingSummary}
      />
      <PackagingApprovalModal
        isOpen={showModal}
        onClose={handleModalClose}
        orderData={selectedItem}
        onApprove={handleApprovePackaging}
        onNextStage={handleNextStage}
      />
    </div>
  );
};

export default PackagingPage;
