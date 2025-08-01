
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { OrderForm } from "@/components/Orders/OrderForm";
import { useOrders } from '@/hooks/useOrders';
import { useTestOrderCreate } from '@/hooks/useTestOrderCreate';
import { toast } from "sonner";

const OrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orders, getOrderById, loading } = useOrders();
  const { testCreateOrder, isTestingCreate } = useTestOrderCreate();
  const [orderData, setOrderData] = useState(null);
  
  // Determine if we're creating a new order or editing an existing one
  const isNewOrder = !id || id === 'new';
  
  // Fetch the order data if editing an existing order
  useEffect(() => {
    if (!isNewOrder && orders.length > 0) {
      const foundOrder = getOrderById(id || '');
      if (foundOrder) {
        console.log("Order found for editing:", foundOrder);
        setOrderData(foundOrder);
      } else {
        console.log("Order not found with id:", id);
        toast.error("Pedido não encontrado");
        navigate('/pedidos');
      }
    } else if (isNewOrder) {
      setOrderData(null);
    }
  }, [isNewOrder, orders, id, getOrderById, navigate]);
  
  // Handle navigation back to orders page
  const handleClose = (refresh: boolean = false) => {
    navigate('/pedidos', { state: { refresh } });
  };

  // Show loading while orders are being fetched
  if (!isNewOrder && loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleClose()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleClose()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</h1>
        </div>
        {isNewOrder && (
          <Button 
            variant="outline" 
            onClick={testCreateOrder}
            disabled={isTestingCreate}
            className="text-sm"
          >
            {isTestingCreate ? 'Testando...' : 'Teste DB'}
          </Button>
        )}
      </div>
      
      <div className="max-w-3xl mx-auto">
        <OrderForm 
          orderData={orderData} 
          onClose={handleClose} 
        />
      </div>
    </div>
  );
};

export default OrderFormPage;
