
import { Button } from "@/components/ui/button";
import { FilePen, FileText, RefreshCw } from "lucide-react";
type Props = { 
  onCreate: () => void;
  onRefresh?: () => Promise<void>;
};

const FiscalEmissionHeader = ({ onCreate, onRefresh }: Props) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold">Emissão Fiscal</h1>
      <p className="text-muted-foreground">Gerenciamento de documentos fiscais eletrônicos.</p>
    </div>
    <div className="flex items-center gap-2">
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      )}
      <Button onClick={onCreate}>
        <FilePen className="mr-2 h-4 w-4" /> Nova Nota Fiscal
      </Button>
      <Button variant="outline">
        <FileText className="mr-2 h-4 w-4" /> Consultar SEFAZ
      </Button>
    </div>
  </div>
);
export default FiscalEmissionHeader;
