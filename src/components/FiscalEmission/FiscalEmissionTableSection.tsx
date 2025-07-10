
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileText, RefreshCw, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  filteredInvoices: any[];
  formatCurrency: (v: number) => string;
  handleEmitInvoice: (invoice: any) => void;
  downloadDANFE: (invoice: any) => void;
  downloadXML: (invoice: any) => void;
  checkStatus: (invoice: any) => void;
  loading?: boolean;
};

const FiscalEmissionTableSection = ({
  filteredInvoices,
  formatCurrency,
  handleEmitInvoice,
  downloadDANFE,
  downloadXML,
  checkStatus,
  loading = false
}: Props) => (
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
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Carregando notas fiscais...
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-accent/5">
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
                    invoice.status === 'Rejeitada' ? 'badge-cancelled' :
                    'badge-route'
                  }`}>
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {invoice.status === 'Pendente' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkStatus(invoice)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Consultar
                      </Button>
                    ) : invoice.status === 'Autorizada' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDANFE(invoice)}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          DANFE
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Download className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => downloadDANFE(invoice)}>
                              <Printer className="h-3 w-3 mr-2" />
                              Baixar DANFE (PDF)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadXML(invoice)}>
                              <FileText className="h-3 w-3 mr-2" />
                              Baixar XML
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => checkStatus(invoice)}>
                              <RefreshCw className="h-3 w-3 mr-2" />
                              Consultar Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkStatus(invoice)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Status
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {!loading && filteredInvoices.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Nenhuma nota fiscal encontrada</p>
          <p>Emita sua primeira NFe a partir de uma venda confirmada</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default FiscalEmissionTableSection;
