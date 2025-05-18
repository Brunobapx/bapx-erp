
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePen, ChevronDown, Search, FileText, Printer } from 'lucide-react';
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
import { toast } from "@/hooks/use-toast";

const FiscalEmissionPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock invoice data
  const invoices = [
    { 
      id: 'NFe-001', 
      type: 'NFe',
      saleId: 'V-001',
      customer: 'Tech Solutions', 
      value: 50000,
      date: '19/05/2025',
      status: 'Autorizada',
      key: '35250500012345678901234567890123456789012345'
    },
    { 
      id: 'NFe-002', 
      type: 'NFe',
      saleId: 'V-002',
      customer: 'Green Energy Inc', 
      value: 75000,
      date: '18/05/2025',
      status: 'Pendente',
      key: ''
    },
    { 
      id: 'NFCe-003', 
      type: 'NFCe',
      saleId: 'V-003',
      customer: 'João Silva', 
      value: 3500,
      date: '17/05/2025',
      status: 'Autorizada',
      key: '35250500012345678901234567890123456789054321'
    },
    { 
      id: 'NFe-004', 
      type: 'NFe',
      saleId: 'V-004',
      customer: 'Global Foods', 
      value: 9800,
      date: '16/05/2025',
      status: 'Autorizada',
      key: '35250500012345678901234567890123456789098765'
    }
  ];

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice => {
    const searchString = searchQuery.toLowerCase();
    return (
      invoice.id.toLowerCase().includes(searchString) ||
      invoice.saleId.toLowerCase().includes(searchString) ||
      invoice.customer.toLowerCase().includes(searchString) ||
      invoice.type.toLowerCase().includes(searchString) ||
      invoice.status.toLowerCase().includes(searchString)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEmitInvoice = (invoice: any) => {
    if (invoice.status === 'Pendente') {
      toast({
        title: "Nota Fiscal Emitida",
        description: `${invoice.id} foi emitida com sucesso para ${invoice.customer}.`,
      });
    } else {
      toast({
        title: "Imprimir DANFE",
        description: `DANFE ${invoice.id} preparada para impressão.`,
      });
    }
  };

  const handleCreateInvoice = () => {
    toast({
      title: "Criar Nota Fiscal",
      description: "Selecione uma venda para emitir a nota fiscal.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Emissão Fiscal</h1>
          <p className="text-muted-foreground">Gerenciamento de documentos fiscais eletrônicos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateInvoice}>
            <FilePen className="mr-2 h-4 w-4" /> Nova Nota Fiscal
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Consultar SEFAZ
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas fiscais..."
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
              <DropdownMenuItem>NFe</DropdownMenuItem>
              <DropdownMenuItem>NFCe</DropdownMenuItem>
              <DropdownMenuItem>CTe</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Autorizada</DropdownMenuItem>
              <DropdownMenuItem>Pendente</DropdownMenuItem>
              <DropdownMenuItem>Cancelada</DropdownMenuItem>
              <DropdownMenuItem>Rejeitada</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem>Mais antigas</DropdownMenuItem>
              <DropdownMenuItem>Maior valor</DropdownMenuItem>
              <DropdownMenuItem>Menor valor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className="hover:bg-accent/5"
                >
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.type}</TableCell>
                  <TableCell>{invoice.saleId}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.value)}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <span className={`stage-badge ${
                      invoice.status === 'Autorizada' ? 'badge-sales' : 
                      invoice.status === 'Pendente' ? 'badge-production' : 
                      'badge-route'
                    }`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleEmitInvoice(invoice)}
                    >
                      {invoice.status === 'Pendente' ? (
                        <>Emitir</>
                      ) : (
                        <>
                          <Printer className="h-3 w-3" />
                          DANFE
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredInvoices.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma nota fiscal encontrada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FiscalEmissionPage;
