import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, List } from 'lucide-react';
import EmitirNotaFiscal from '@/components/NotaFiscal/EmitirNotaFiscal';
import NotasEmitidas from '@/components/NotaFiscal/NotasEmitidas';
import { ModuleAccessCheck } from '@/components/Auth/ModuleAccessCheck';

const NotaFiscalPage = () => {
  return (
    <ModuleAccessCheck routePath="/nota-fiscal">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nota Fiscal Eletrônica</h1>
          <p className="text-muted-foreground">
            Gerencie emissão de notas fiscais integrada com Focus NFe
          </p>
        </div>

        <Tabs defaultValue="emitir" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emitir" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Emitir NFe
            </TabsTrigger>
            <TabsTrigger value="consultar" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Notas Emitidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emitir" className="space-y-6">
            <EmitirNotaFiscal />
          </TabsContent>

          <TabsContent value="consultar" className="space-y-6">
            <NotasEmitidas />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleAccessCheck>
  );
};

export default NotaFiscalPage;