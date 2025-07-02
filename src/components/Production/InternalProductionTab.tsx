import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from 'lucide-react';
import { InternalProductionModal } from './InternalProductionModal';
import { InternalProductionTable } from './InternalProductionTable';

export const InternalProductionTab = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Produção Interna</h2>
          <p className="text-muted-foreground">
            Gerencie produções internas diárias para alimentar o estoque
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Produção Interna
        </Button>
      </div>

      <InternalProductionTable />

      <InternalProductionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};