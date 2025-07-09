import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import { exportData, ExportOptions } from '@/utils/importExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  defaultHeaders: string[];
  defaultFilename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  defaultHeaders,
  defaultFilename
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [filename, setFilename] = useState(defaultFilename);
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>(defaultHeaders);
  const [isExporting, setIsExporting] = useState(false);

  const handleHeaderToggle = (header: string, checked: boolean) => {
    if (checked) {
      setSelectedHeaders([...selectedHeaders, header]);
    } else {
      setSelectedHeaders(selectedHeaders.filter(h => h !== header));
    }
  };

  const handleSelectAll = () => {
    setSelectedHeaders(defaultHeaders);
  };

  const handleSelectNone = () => {
    setSelectedHeaders([]);
  };

  const handleExport = async () => {
    if (selectedHeaders.length === 0) {
      alert('Selecione pelo menos um campo para exportar');
      return;
    }

    try {
      setIsExporting(true);

      const exportOptions: ExportOptions = {
        format,
        filename,
        data,
        headers: selectedHeaders,
        title
      };

      exportData(exportOptions);
      onClose();
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setFormat('xlsx');
    setFilename(defaultFilename);
    setSelectedHeaders(defaultHeaders);
    setIsExporting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato do arquivo</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (.csv)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" disabled />
                <Label htmlFor="pdf" className="text-gray-400">PDF (em breve)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Nome do arquivo
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="nome_do_arquivo"
            />
          </div>

          {/* Headers Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Campos para exportar</Label>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-6 px-2 text-xs"
                >
                  Todos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectNone}
                  className="h-6 px-2 text-xs"
                >
                  Nenhum
                </Button>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
              {defaultHeaders.map((header) => (
                <div key={header} className="flex items-center space-x-2">
                  <Checkbox
                    id={header}
                    checked={selectedHeaders.includes(header)}
                    onCheckedChange={(checked) => 
                      handleHeaderToggle(header, checked as boolean)
                    }
                  />
                  <Label htmlFor={header} className="text-sm font-normal">
                    {header}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{data.length}</span> registros serão exportados
              {selectedHeaders.length > 0 && (
                <span> com <span className="font-medium">{selectedHeaders.length}</span> campos</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedHeaders.length === 0}
            >
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};