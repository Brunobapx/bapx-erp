
import React, { useState } from "react";
import { ServiceOrderForm } from "@/components/ServiceOrders/ServiceOrderForm";
import { ServiceOrderList } from "@/components/ServiceOrders/ServiceOrderList";
import { ServiceOrderStats } from "@/components/ServiceOrders/ServiceOrderStats";
import { TechnicianPerformanceCard } from "@/components/ServiceOrders/TechnicianPerformanceCard";
import { DistributionCharts } from "@/components/ServiceOrders/DistributionCharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, List, PlusCircle } from "lucide-react";
import { useServiceOrdersDashboard } from "@/hooks/useServiceOrdersDashboard";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const ServiceOrdersPage: React.FC = () => {
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: dashboardData, isLoading } = useServiceOrdersDashboard();

  const handleNewOrder = () => {
    setEditingOrder(null);
    setShowForm(true);
    setActiveTab('form');
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingOrder(null);
    setActiveTab('list');
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setShowForm(true);
    setActiveTab('form');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <Button onClick={handleNewOrder}>
            <Plus className="mr-2 h-4 w-4" /> Nova OS
          </Button>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
        <Button onClick={handleNewOrder} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Nova OS
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista OSs
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2" disabled={!showForm}>
            <PlusCircle className="h-4 w-4" />
            {editingOrder ? 'Editar OS' : 'Nova OS'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              <ServiceOrderStats stats={dashboardData.stats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TechnicianPerformanceCard technicians={dashboardData.technicians} />
                
                <div className="lg:col-span-1">
                  <DistributionCharts 
                    priorityDistribution={dashboardData.priorityDistribution}
                    typeDistribution={dashboardData.typeDistribution}
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="list">
          <ServiceOrderList onEdit={handleEditOrder} />
        </TabsContent>

        <TabsContent value="form">
          {showForm && (
            <ServiceOrderForm order={editingOrder} onSaved={handleSaved} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceOrdersPage;
