import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronDown } from 'lucide-react';
type Props = {
  onCreate: () => void;
  orderSort: string;
  setOrderSort: (v: string) => void;
};
const VendorsHeader = ({
  onCreate,
  orderSort,
  setOrderSort
}: Props) => <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold">Fornecedores</h1>
      <p className="text-muted-foreground">Cadastro e gerenciamento de fornecedores.</p>
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={onCreate} className="bg-erp-production hover:bg-erp-production/90">
        <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
      </Button>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOrderSort('az')}>Nome (A-Z)</Button>
        <Button variant="outline" size="sm" onClick={() => setOrderSort('za')}>Nome (Z-A)</Button>
        <Button variant="outline" size="sm" onClick={() => setOrderSort('created')}>Data Cadastro</Button>
      </div>
    </div>
  </div>;
export default VendorsHeader;