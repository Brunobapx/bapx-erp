
import React, { useState } from "react";
import { ServiceOrderForm } from "@/components/ServiceOrders/ServiceOrderForm";
import { ServiceOrderList } from "@/components/ServiceOrders/ServiceOrderList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ServiceOrdersPage: React.FC = () => {
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const handleNewOrder = () => {
    setEditingOrder(null);
    setShowForm(true);
  };
  const handleSaved = () => {
    setShowForm(false);
    setEditingOrder(null);
    // Opcionalmente, mostre um toast de sucesso
  };
  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button onClick={handleNewOrder}>
          <Plus className="mr-2" /> Nova OS
        </Button>
      </div>
      {showForm ? (
        <ServiceOrderForm order={editingOrder} onSaved={handleSaved} />
      ) : (
        <ServiceOrderList onEdit={handleEditOrder} />
      )}
    </div>
  );
};

export default ServiceOrdersPage;
