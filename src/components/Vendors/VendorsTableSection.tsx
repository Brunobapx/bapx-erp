
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredVendors: any[];
  setSelectedVendor: (v: any) => void;
  setShowModal: (show: boolean) => void;
  setVendorToDelete: (id: string) => void;
};

const VendorsTableSection = ({
  searchQuery,
  setSearchQuery,
  filteredVendors,
  setSelectedVendor,
  setShowModal,
  setVendorToDelete
}: Props) => (
  <>
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
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setShowModal(true);
                  }}
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
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setShowModal(true);
                      }}
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
  </>
);

export default VendorsTableSection;
