import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ChevronDown, Search, FileText, Plus, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VendorModal } from '@/components/Modals/VendorModal';
import { useVendors } from '@/hooks/useVendors';
import { toast } from "sonner";

const VendorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderSort, setOrderSort] = useState('az');

  const { vendors, loading, error, deleteVendor, refreshVendors } = useVendors();

  // Filter vendors based on search query
  const filteredVendorsInitial = vendors.filter(vendor => {
    const searchString = searchQuery.toLowerCase();
    return (
      (vendor.name && vendor.name.toLowerCase().includes(searchString)) ||
      (vendor.cnpj && vendor.cnpj.toLowerCase().includes(searchString)) ||
      (vendor.email && vendor.email.toLowerCase().includes(searchString)) ||
      (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchString))
    );
  });

  // Ordenação
  const filteredVendors = [...filteredVendorsInitial].sort((a, b) => {
    if (orderSort === 'az') return (a.name || '').localeCompare(b.name || '');
    if (orderSort === 'za') return (b.name || '').localeCompare(a.name || '');
    if (orderSort === 'created') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    return 0;
  });

  const handleVendorClick = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteVendor(vendorToDelete);
      setVendorToDelete(null);
    } catch (error) {
      // Error already handled in the hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalClose = (refresh?: boolean) => {
    setShowModal(false);
    setSelectedVendor(null);
    if (refresh) {
      refreshVendors();
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Carregando fornecedores...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Erro ao carregar fornecedores: {error}</div>
        </div>
      </div>
    );
  }

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
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOrderSort('az')}>Nome (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrderSort('za')}>Nome (Z-A)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrderSort('created')}>Data de Cadastro</DropdownMenuItem>
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
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleVendorClick(vendor)}
                  >
                    {vendor.name}
                  </TableCell>
                  <TableCell>{vendor.cnpj || '-'}</TableCell>
                  <TableCell>{vendor.email || '-'}</TableCell>
                  <TableCell>{vendor.phone || '-'}</TableCell>
                  <TableCell>{vendor.contact_person || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVendorClick(vendor)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendorToDelete(vendor.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredVendors.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'Nenhum fornecedor encontrado com esse termo.' : 'Nenhum fornecedor cadastrado.'}
            </div>
          )}
        </CardContent>
      </Card>
      
      <VendorModal
        isOpen={showModal}
        onClose={handleModalClose}
        vendorData={selectedVendor || null}
      />

      <AlertDialog open={!!vendorToDelete} onOpenChange={() => setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVendor}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorsPage;
