
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ChevronDown, Search, FileText, Plus, Loader2 } from 'lucide-react';
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
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshClients 
  } = useClients();

  const handleClientClick = (client: any) => {
    console.log('ClientsPage - client clicked:', client);
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleNewClient = () => {
    console.log('ClientsPage - new client button clicked');
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
    console.log('ClientsPage - modal closed, refresh:', refresh);
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
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              Erro ao carregar clientes: {error}
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
                      <TableCell className="font-medium">{client.name || ''}</TableCell>
                      <TableCell>{getDocumentId(client)}</TableCell>
                      <TableCell>{getRegisterNumber(client)}</TableCell>
                      <TableCell>{client.email || ''}</TableCell>
                      <TableCell>{client.phone || ''}</TableCell>
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
          {!loading && !error && safeFilteredClients.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum cliente encontrado.
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
