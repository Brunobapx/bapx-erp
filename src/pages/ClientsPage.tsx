
import React from "react";
import { useClients } from "@/hooks/useClients";
import { ClientsTable } from "@/components/Clients/ClientsTable";
import { Input } from "@/components/ui/input";

const ClientsPage: React.FC = () => {
  const { clients, loading, error, searchQuery, setSearchQuery } = useClients();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Input
          type="text"
          placeholder="Buscar por nome, CNPJ/CPF, email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <ClientsTable clients={clients} loading={loading} error={error} />
    </div>
  );
};

export default ClientsPage;
