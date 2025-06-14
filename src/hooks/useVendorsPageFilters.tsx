
import { useState } from 'react';
import { useVendors } from '@/hooks/useVendors';

const useVendorsPageFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderSort, setOrderSort] = useState('az');
  const { vendors, loading, error, deleteVendor, refreshVendors } = useVendors();

  // Filter & sort
  const filteredVendorsInitial = vendors.filter(vendor => {
    const searchString = searchQuery.toLowerCase();
    return (
      (vendor.name && vendor.name.toLowerCase().includes(searchString)) ||
      (vendor.cnpj && vendor.cnpj.toLowerCase().includes(searchString)) ||
      (vendor.email && vendor.email.toLowerCase().includes(searchString)) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchString))
    );
  });
  const filteredVendors = [...filteredVendorsInitial].sort((a, b) => {
    if (orderSort === 'az') return (a.name || '').localeCompare(b.name || '');
    if (orderSort === 'za') return (b.name || '').localeCompare(a.name || '');
    if (orderSort === 'created') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    return 0;
  });

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      setIsDeleting(true);
      await deleteVendor(vendorToDelete);
      setVendorToDelete(null);
    } catch (error) {
      // handled in hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = (refresh?: boolean) => {
    setShowModal(false);
    setSelectedVendor(null);
    if (refresh) refreshVendors();
  };

  return {
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
  };
};

export default useVendorsPageFilters;
