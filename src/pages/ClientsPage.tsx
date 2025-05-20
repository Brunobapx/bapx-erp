
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";

const ClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<{field: string, direction: string}>({
    field: 'name',
    direction: 'asc'
  });

  // Fetch clients from Supabase
  const { data: clients, isLoading, isError, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        let query = supabase.from('clients').select('*');
        
        if (sortOrder.field && sortOrder.direction) {
          query = query.order(sortOrder.field, { ascending: sortOrder.direction === 'asc' });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
      } catch (error: any) {
        console.error("Erro ao carregar clientes:", error);
        toast({
          title: "Erro",
          description: `Erro ao carregar clientes: ${error.message}`,
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Filter clients based on search query and type filter
  const filteredClients = clients?.filter(client => {
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = (
      client.name.toLowerCase().includes(searchString) ||
      (client.cnpj && client.cnpj.toLowerCase().includes(searchString)) ||
      (client.cpf && client.cpf.toLowerCase().includes(searchString)) ||
      (client.email && client.email.toLowerCase().includes(searchString))
    );
    
    const matchesType = typeFilter ? client.type === typeFilter : true;
    
    return matchesSearch && matchesType;
  }) || [];

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    refetch(); // Refresh client list after modal closes
  };

  const handleSortChange = (field: string) => {
    setSortOrder(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('Física')}>Pessoa Física</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('Jurídica')}>Pessoa Jurídica</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('name')}>
                Nome {sortOrder.field === 'name' ? (sortOrder.direction === 'asc' ? '(A-Z)' : '(Z-A)') : '(A-Z)'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('created_at')}>
                {sortOrder.field === 'created_at' ? 
                  (sortOrder.direction === 'desc' ? 'Mais recentes' : 'Mais antigos') : 
                  'Mais recentes'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Carregando clientes...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Erro ao carregar clientes</div>
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
          )}
          {!isLoading && !isError && filteredClients.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <ClientModal
        isOpen={showModal}
        onClose={handleCloseModal}
        clientData={selectedClient || null}
      />
    </div>
  );
};

export default ClientsPage;
