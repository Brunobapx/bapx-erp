
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
import { Printer } from "lucide-react";

type Props = {
  filteredInvoices: any[];
  formatCurrency: (v: number) => string;
  handleEmitInvoice: (invoice: any) => void;
};

const FiscalEmissionTableSection = ({
  filteredInvoices,
  formatCurrency,
  handleEmitInvoice
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
          {filteredInvoices.map((invoice) => (
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
);

export default FiscalEmissionTableSection;
