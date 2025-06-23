
import React from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { StatusCards } from '@/components/Dashboard/StatusCards';
import { ProcessFunnel } from '@/components/Dashboard/ProcessFunnel';

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema ERP.</p>
        </div>
      </div>
      
      <StatusCards />
      <ProcessFunnel />
    </div>
  );
};

export default Index;
