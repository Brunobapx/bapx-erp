
import { useState } from "react";
import { usePackaging } from '@/hooks/usePackaging';
import { usePackagingFilters } from '@/hooks/usePackagingFilters';
import { usePackagingSummary } from '@/hooks/usePackagingSummary';

const usePackagingPageFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [orderSort, setOrderSort] = useState('recent');
  const [alerts, setAlerts] = useState([
    {
      id: 'alert-1',
      type: 'packaging' as const,
      message: 'Embalagem #EMB-003 aguardando confirmação há 1 dia',
      time: '1 dia'
    }
  ]);
  const { packagings, loading, updatePackagingStatus, refreshPackagings } = usePackaging();
  const filteredItems = usePackagingFilters(packagings, searchQuery, statusFilter, orderSort);
  const packagingSummary = usePackagingSummary(packagings);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleViewItem = (e: any, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleEditItem = (e: any, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (e: any, item: any) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a embalagem ${item.packaging_number}?`)) {
      refreshPackagings();
    }
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleApprovePackaging = async (data: any) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'approved', data.quantityPackaged, data.qualityCheck);
      if (success) setShowModal(false);
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleNextStage = async (data: any) => {
    if (selectedItem) {
      const success = await updatePackagingStatus(selectedItem.id, 'in_progress', data.quantityPackaged);
      if (success) setShowModal(false);
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  const handleCreatePackaging = () => {
    const newPackaging = {
      id: 'new',
      packaging_number: 'NOVO',
      product_name: '',
      quantity_to_package: 1,
      quantity_packaged: 0,
      status: 'pending' as const,
      quality_check: false,
      client_name: '',
      order_number: ''
    };
    setSelectedItem(newPackaging);
    setShowModal(true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    if (refresh) refreshPackagings();
  };

  const formatDate = (dateString?: string) => (!dateString ? '-' :
    new Date(dateString).toLocaleDateString('pt-BR'));

  const getStatusBadgeClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  return {
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
    handleCreatePackaging,
    handleModalClose,
    packagingSummary,
    formatDate,
    getStatusBadgeClass
  };
};

export default usePackagingPageFilters;
