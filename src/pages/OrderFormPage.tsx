
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { OrderForm } from "@/components/Orders/OrderForm";
import { useOrders } from '@/hooks/useOrders';
import { toast } from "sonner";

const OrderFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orders, getOrderById } = useOrders();
  
  // Determine if we're creating a new order or editing an existing one
  const isNewOrder = !id || id === 'new';
  
  // Fetch the order data if editing an existing order
  const orderData = isNewOrder ? null : getOrderById(id || '');
  
  // If we're editing an order and it doesn't exist, redirect back to orders page
  useEffect(() => {
    if (!isNewOrder && !orderData) {
      toast.error("Pedido não encontrado");
      navigate('/pedidos');
    }
  }, [isNewOrder, orderData, navigate]);
  
  // Handle navigation back to orders page
  const handleClose = (refresh: boolean = false) => {
    navigate('/pedidos', { state: { refresh } });
  };
  
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
        <h1 className="text-2xl font-bold">{isNewOrder ? 'Novo Pedido' : 'Editar Pedido'}</h1>
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
