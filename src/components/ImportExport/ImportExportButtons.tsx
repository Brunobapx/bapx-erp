import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';

interface ImportExportButtonsProps {
  onImport: () => void;
  onExport: () => void;
  disabled?: boolean;
  importLabel?: string;
  exportLabel?: string;
}

export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  onImport,
  onExport,
  disabled = false,
  importLabel = 'Importar',
  exportLabel = 'Exportar'
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onImport}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {importLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {exportLabel}
      </Button>
    </div>
  );
};