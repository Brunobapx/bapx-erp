
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
import { ImportExportButtons } from '@/components/ImportExport/ImportExportButtons';
import { ImportModal } from '@/components/ImportExport/ImportModal';
import { ExportModal } from '@/components/ImportExport/ExportModal';
import { useClientImportExport } from '@/hooks/useClientImportExport';

const ClientsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const { 
    clients: filteredClients, 
    allClients,
    loading, 
    error, 
    searchQuery, 
    setSearchQuery, 
    refreshClients 
  } = useClients();

  const {
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    clientHeaders,
    exportData,
    validateClient,
    importClients,
    exportClients,
    downloadTemplate
  } = useClientImportExport();

  console.log('ClientsPage - Estado atual:', {
    loading,
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
    return client.type === 'PJ' ? (client.cnpj || '') : (client.cpf || '');
  };

  const getRegisterNumber = (client: any) => {
    if (!client) return '';
    return client.type === 'PJ' ? (client.ie || '') : (client.rg || '');
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
          <ImportExportButtons
            onImport={() => setIsImportModalOpen(true)}
            onExport={exportClients}
            disabled={loading}
          />
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <FileText className="mr-2 h-4 w-4" />
            Template
          </Button>
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
      
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
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
                        <span className={`stage-badge ${client.type === 'PJ' ? 'badge-order' : 'badge-production'}`}>
                          {client.type === 'PJ' ? 'PJ' : 'PF'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!loading && !error && safeFilteredClients.length === 0 && (
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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Clientes"
        onImport={importClients}
        validator={validateClient}
        templateDownload={downloadTemplate}
        acceptedFormats=".xlsx,.csv"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportar Clientes"
        data={exportData}
        defaultHeaders={clientHeaders}
        defaultFilename="clientes"
      />
    </div>
  );
};

export default ClientsPage;
