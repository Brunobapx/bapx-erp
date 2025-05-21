
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ChevronDown, Search, FileText, Plus } from 'lucide-react';
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

const ClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Mock client data
  const clients = [
    { 
      id: 1, 
      name: 'Tech Solutions Ltda', 
      cnpj: '12.345.678/0001-90', 
      ie: '123456789', 
      email: 'contato@techsolutions.com',
      phone: '(11) 3456-7890',
      address: 'Av. Paulista, 1000, São Paulo - SP',
      type: 'Jurídica'
    },
    { 
      id: 2, 
      name: 'Green Energy Inc', 
      cnpj: '98.765.432/0001-21', 
      ie: '987654321', 
      email: 'contato@greenenergy.com',
      phone: '(11) 9876-5432',
      address: 'Rua Augusta, 500, São Paulo - SP',
      type: 'Jurídica'
    },
    { 
      id: 3, 
      name: 'João Silva', 
      cpf: '123.456.789-00', 
      rg: '12.345.678-9', 
      email: 'joao.silva@email.com',
      phone: '(11) 91234-5678',
      address: 'Rua das Flores, 123, São Paulo - SP',
      type: 'Física'
    },
    { 
      id: 4, 
      name: 'Global Foods SA', 
      cnpj: '45.678.901/0001-23', 
      ie: '456789012', 
      email: 'contato@globalfoods.com',
      phone: '(11) 4567-8901',
      address: 'Av. Rebouças, 1500, São Paulo - SP',
      type: 'Jurídica'
    },
  ];

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const searchString = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchString) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
      client.email.toLowerCase().includes(searchString)
    );
  });

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const getDocumentId = (client: any) => {
    return client.type === 'Jurídica' ? client.cnpj : client.cpf;
  };

  const getRegisterNumber = (client: any) => {
    return client.type === 'Jurídica' ? client.ie : client.rg;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowModal(true)} className="bg-erp-order hover:bg-erp-order/90">
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
            value={searchQuery}
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
              {filteredClients.map((client) => (
                <TableRow 
                  key={client.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleClientClick(client)}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{getDocumentId(client)}</TableCell>
                  <TableCell>{getRegisterNumber(client)}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${client.type === 'Jurídica' ? 'badge-order' : 'badge-production'}`}>
                      {client.type === 'Jurídica' ? 'PJ' : 'PF'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredClients.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ClientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        clientData={selectedClient || null}
      />
    </div>
  );
};

export default ClientsPage;
