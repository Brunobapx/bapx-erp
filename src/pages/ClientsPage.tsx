
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ChevronDown, Search, FileText, Plus, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientModal } from '@/components/Modals/ClientModal';
import { useClients } from '@/hooks/useClients';

const ClientsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { 
    clients: filteredClients, 
    allClients,
    isLoading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshClients 
  } = useClients();

  console.log('ClientsPage - Estado atual:', {
    isLoading,
    error,
    filteredClientsCount: filteredClients?.length || 0,
    allClientsCount: allClients?.length || 0,
    searchQuery
  });

  const handleClientClick = (client: any) => {
    console.log('ClientsPage - Cliente clicado:', client);
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleNewClient = () => {
    console.log('ClientsPage - Novo cliente');
    setSelectedClient(null);
    setShowModal(true);
  };

  const getDocumentId = (client: any) => {
    if (!client) return '';
    return client.type === 'Jurídica' ? (client.cnpj || '') : (client.cpf || '');
  };

  const getRegisterNumber = (client: any) => {
    if (!client) return '';
    return client.type === 'Jurídica' ? (client.ie || '') : (client.rg || '');
  };

  const handleModalClose = (refresh = false) => {
    console.log('ClientsPage - Modal fechado, refresh:', refresh);
    setShowModal(false);
    setSelectedClient(null);
    
    if (refresh) {
      refreshClients();
    }
  };

  // Ensure filteredClients is always an array
  const safeFilteredClients = Array.isArray(filteredClients) ? filteredClients : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewClient} className="bg-erp-order hover:bg-erp-order/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Relatório Fiscal
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshClients}>
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Tipo <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Pessoa Física</DropdownMenuItem>
              <DropdownMenuItem>Pessoa Jurídica</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Nome (A-Z)</DropdownMenuItem>
              <DropdownMenuItem>Nome (Z-A)</DropdownMenuItem>
              <DropdownMenuItem>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem>Mais antigos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Debug info - remove in production */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        Debug: Loading: {isLoading ? 'Sim' : 'Não'} | 
        Erro: {error || 'Nenhum'} | 
        Total clientes: {allClients?.length || 0} | 
        Filtrados: {safeFilteredClients.length}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Carregando clientes...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-medium">Erro ao carregar clientes</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={refreshClients}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>RG/IE</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeFilteredClients.map((client) => {
                  if (!client || !client.id) return null;
                  
                  return (
                    <TableRow 
                      key={client.id}
                      className="cursor-pointer hover:bg-accent/5"
                      onClick={() => handleClientClick(client)}
                    >
                      <TableCell className="font-medium">{client.name || 'Nome não informado'}</TableCell>
                      <TableCell>{getDocumentId(client) || 'Não informado'}</TableCell>
                      <TableCell>{getRegisterNumber(client) || 'Não informado'}</TableCell>
                      <TableCell>{client.email || 'Não informado'}</TableCell>
                      <TableCell>{client.phone || 'Não informado'}</TableCell>
                      <TableCell>
                        <span className={`stage-badge ${client.type === 'Jurídica' ? 'badge-order' : 'badge-production'}`}>
                          {client.type === 'Jurídica' ? 'PJ' : 'PF'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!isLoading && !error && safeFilteredClients.length === 0 && (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchQuery ? 'Tente alterar os filtros de busca' : 'Clique em "Novo Cliente" para adicionar o primeiro cliente'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={handleNewClient} 
                  className="mt-4 bg-erp-order hover:bg-erp-order/90"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar primeiro cliente
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ClientModal
        isOpen={showModal}
        onClose={handleModalClose}
        clientData={selectedClient}
      />
    </div>
  );
};

export default ClientsPage;
