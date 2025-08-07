
import React from 'react';
import StageAlert from '@/components/Alerts/StageAlert';
import PackagingHeader from "@/components/Packaging/PackagingHeader";
import PackagingTabs from "@/components/Packaging/PackagingTabs";
import PackagingApprovalModal from "@/components/Packaging/PackagingApprovalModal";
import usePackagingPageFilters from "@/hooks/usePackagingPageFilters";

const PackagingPage = () => {
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
    getStatusBadgeClass,
    handleCreatePackaging
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
