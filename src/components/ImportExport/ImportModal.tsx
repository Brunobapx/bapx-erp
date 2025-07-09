import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X 
} from 'lucide-react';
import { processImportFile, ImportResult } from '@/utils/importExport';
import { toast } from 'sonner';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onImport: (data: any[]) => Promise<void>;
  validator: (data: any) => string[];
  templateDownload: () => void;
  acceptedFormats?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  title,
  onImport,
  validator,
  templateDownload,
  acceptedFormats = '.xlsx,.csv'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setShowPreview(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processFile = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(25);

      const result = await processImportFile(file, validator);
      setProgress(75);
      
      setImportResult(result);
      setShowPreview(true);
      setProgress(100);
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!importResult || importResult.validData.length === 0) return;

    try {
      setIsProcessing(true);
      await onImport(importResult.validData);
      toast.success(`${importResult.success} registros importados com sucesso!`);
      handleClose();
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setShowPreview(false);
    setProgress(0);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Precisa de um template?</h4>
              <p className="text-sm text-blue-700">
                Baixe o template com exemplos para facilitar a importação
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={templateDownload}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>

          {/* File Upload Area */}
          {!showPreview && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <File className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">{file.name}</p>
                    <p className="text-sm text-green-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={processFile}
                      disabled={isProcessing}
                    >
                      Processar Arquivo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Arraste o arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-gray-500">
                      Formatos aceitos: {acceptedFormats.replace(/\./g, '').toUpperCase()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFormats}
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) handleFileSelect(selectedFile);
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Preview Results */}
          {showPreview && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-800">
                    {importResult.success}
                  </p>
                  <p className="text-sm text-green-600">Válidos</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-800">
                    {importResult.errors.length}
                  </p>
                  <p className="text-sm text-red-600">Erros</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <File className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-800">
                    {importResult.total}
                  </p>
                  <p className="text-sm text-blue-600">Total</p>
                </div>
              </div>

              {/* Errors List */}
              {importResult.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Erros encontrados:</p>
                      <div className="max-h-32 overflow-y-auto text-sm">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-red-600">• {error}</p>
                        ))}
                        {importResult.errors.length > 10 && (
                          <p className="text-gray-500">
                            ... e mais {importResult.errors.length - 10} erros
                          </p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Voltar
                </Button>
                {importResult.success > 0 && (
                  <Button
                    onClick={confirmImport}
                    disabled={isProcessing}
                  >
                    Importar {importResult.success} registros
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};