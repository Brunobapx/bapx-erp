
import React, { useState } from 'react';
import { ProductModal } from '@/components/Modals/ProductModal';
import { useProducts } from '@/hooks/useProducts';
import { ProductsHeader } from '@/components/Products/ProductsHeader';
import { ProductsFilter } from '@/components/Products/ProductsFilter';
import { ProductsTable } from '@/components/Products/ProductsTable';

const ProductsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const { 
    filteredProducts, 
    isLoading, 
    refetch, 
    searchQuery, 
    setSearchQuery, 
    categoryFilter, 
    setCategoryFilter,
    sortOrder, 
    setSortOrder,
    categories,
    formatCurrency
  } = useProducts();

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleModalClose = (refreshNeeded = false) => {
    setShowModal(false);
    setSelectedProduct(null);
    
    // Refresh products if a product was added or updated
    if (refreshNeeded) {
      refetch();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <ProductsHeader onNewProduct={handleNewProduct} />
      
      <ProductsFilter 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        categories={categories}
      />
      
      <ProductsTable 
        products={filteredProducts}
        isLoading={isLoading}
        onProductClick={handleProductClick}
        formatCurrency={formatCurrency}
      />
      
      <ProductModal
        isOpen={showModal}
        onClose={handleModalClose}
        productData={selectedProduct}
      />
    </div>
  );
};

export default ProductsPage;
