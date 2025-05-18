
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ChevronDown, Search, FileText, Plus } from 'lucide-react';
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
import { VendorModal } from '@/components/Modals/VendorModal';

const VendorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Mock vendor data
  const vendors = [
    { 
      id: 1, 
      name: 'Fornecedores Unidos Ltda', 
      cnpj: '12.345.678/0001-90', 
      ie: '123456789', 
      email: 'contato@fornecedoresunidos.com',
      phone: '(11) 3456-7890',
      address: 'Av. Industrial, 1000, São Paulo - SP',
      type: 'Distribuidor'
    },
    { 
      id: 2, 
      name: 'Matéria Prima S/A', 
      cnpj: '98.765.432/0001-21', 
      ie: '987654321', 
      email: 'vendas@materiaprima.com',
      phone: '(11) 9876-5432',
      address: 'Rua das Indústrias, 500, São Paulo - SP',
      type: 'Fabricante'
    },
    { 
      id: 3, 
      name: 'Tecnologia Avançada Ltda', 
      cnpj: '45.678.901/0001-23', 
      ie: '456789012', 
      email: 'vendas@tecnologiaavancada.com',
      phone: '(11) 4567-8901',
      address: 'Av. Paulista, 1500, São Paulo - SP',
      type: 'Importador'
    },
    { 
      id: 4, 
      name: 'Importadora Global Ltda', 
      cnpj: '78.901.234/0001-56', 
      ie: '789012345', 
      email: 'contato@importadoraglobal.com',
      phone: '(11) 7890-1234',
      address: 'Av. do Comércio, 800, São Paulo - SP',
      type: 'Importador'
    },
  ];

  // Filter vendors based on search query
  const filteredVendors = vendors.filter(vendor => {
    const searchString = searchQuery.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(searchString) ||
      vendor.cnpj.toLowerCase().includes(searchString) ||
      vendor.email.toLowerCase().includes(searchString) ||
      vendor.type.toLowerCase().includes(searchString)
    );
  });

  const handleVendorClick = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de fornecedores.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowModal(true)} className="bg-erp-production hover:bg-erp-production/90">
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
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
            placeholder="Buscar fornecedores..."
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
              <DropdownMenuItem>Distribuidor</DropdownMenuItem>
              <DropdownMenuItem>Fabricante</DropdownMenuItem>
              <DropdownMenuItem>Importador</DropdownMenuItem>
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
              <DropdownMenuItem>Tipo (A-Z)</DropdownMenuItem>
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
                <TableHead>CNPJ</TableHead>
                <TableHead>IE</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => handleVendorClick(vendor)}
                >
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.cnpj}</TableCell>
                  <TableCell>{vendor.ie}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${
                      vendor.type === 'Distribuidor' ? 'badge-sales' : 
                      vendor.type === 'Fabricante' ? 'badge-production' : 'badge-finance'
                    }`}>
                      {vendor.type}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredVendors.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhum fornecedor encontrado.
            </div>
          )}
        </CardContent>
      </Card>
      
      <VendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        vendorData={selectedVendor || null}
      />
    </div>
  );
};

export default VendorsPage;
