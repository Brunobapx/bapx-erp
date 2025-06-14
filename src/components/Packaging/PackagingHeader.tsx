
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onCreate: () => void;
};

const PackagingHeader = ({ onCreate }: Props) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold">Embalagem</h1>
      <p className="text-muted-foreground">Gerencie todos os produtos para embalagem.</p>
    </div>
    <Button onClick={onCreate}>
      <Package className="mr-2 h-4 w-4" /> Nova Embalagem
    </Button>
  </div>
);

export default PackagingHeader;
