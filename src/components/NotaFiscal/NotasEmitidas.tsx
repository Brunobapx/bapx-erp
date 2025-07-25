import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  X, 
  Loader2,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from 'lucide-react';
import { useNotaFiscal } from '@/hooks/useNotaFiscal';

const NotasEmitidas = () => {
  const { 
    notas, 
    loading, 
    consultarStatus, 
    cancelarNota, 
    baixarPDF, 
    baixarXML,
    loadNotas 
  } = useNotaFiscal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelModal, setCancelModal] = useState<{ open: boolean; notaId: string }>({ 
    open: false, 
    notaId: '' 
  });
  const [cancelReason, setCancelReason] = useState('');
  const [consultingStatus, setConsultingStatus] = useState<string | null>(null);

  const filteredNotas = notas.filter(nota =>
    nota.numero_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nota.chave_acesso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nota.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'processando': { variant: 'secondary' as const, icon: Clock, text: 'Processando' },
      'autorizado': { variant: 'default' as const, icon: CheckCircle, text: 'Autorizado' },
      'rejeitado': { variant: 'destructive' as const, icon: XCircle, text: 'Rejeitado' },
      'cancelado': { variant: 'outline' as const, icon: X, text: 'Cancelado' },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.processando;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const handleConsultarStatus = async (notaId: string) => {
    setConsultingStatus(notaId);
    await consultarStatus(notaId);
    setConsultingStatus(null);
  };

  const handleCancelarNota = async () => {
    if (!cancelReason.trim()) {
      return;
    }

    const success = await cancelarNota(cancelModal.notaId, cancelReason);
    if (success) {
      setCancelModal({ open: false, notaId: '' });
      setCancelReason('');
    }
  };

  const handleImprimirDANFE = (nota: any) => {
    if (nota.json_resposta?.caminho_danfe) {
      const printWindow = window.open(nota.json_resposta.caminho_danfe, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando notas emitidas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas Fiscais Emitidas
          </div>
          <Button variant="outline" size="sm" onClick={loadNotas}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Pesquisar por número, chave ou status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredNotas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma nota fiscal encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Chave de Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotas.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell className="font-medium">
                        {nota.numero_nota || 'Processando...'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {nota.tipo_nota.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {nota.chave_acesso ? 
                          `${nota.chave_acesso.substring(0, 8)}...${nota.chave_acesso.substring(-8)}` : 
                          'Processando...'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(nota.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(nota.emitida_em).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConsultarStatus(nota.id)}
                            disabled={consultingStatus === nota.id}
                          >
                            {consultingStatus === nota.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>

                          {nota.status === 'autorizado' && nota.json_resposta?.caminho_danfe && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => baixarPDF(nota)}
                                title="Baixar DANFE (PDF)"
                              >
                                <Download className="h-3 w-3" />
                                DANFE
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleImprimirDANFE(nota)}
                                title="Imprimir DANFE"
                              >
                                <Printer className="h-3 w-3" />
                                Imprimir
                              </Button>
                            </>
                          )}

                          {nota.status === 'autorizado' && nota.json_resposta?.caminho_xml_nota_fiscal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => baixarXML(nota)}
                              title="Baixar XML da NFe"
                            >
                              <Download className="h-3 w-3" />
                              XML
                            </Button>
                          )}

                          {nota.status === 'autorizado' && (
                            <Dialog 
                              open={cancelModal.open && cancelModal.notaId === nota.id}
                              onOpenChange={(open) => setCancelModal({ open, notaId: open ? nota.id : '' })}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <X className="h-3 w-3" />
                                  Cancelar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cancelar Nota Fiscal</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason">Motivo do Cancelamento</Label>
                                    <Textarea
                                      id="reason"
                                      placeholder="Digite o motivo do cancelamento (mínimo 15 caracteres)"
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      minLength={15}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setCancelModal({ open: false, notaId: '' });
                                        setCancelReason('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleCancelarNota}
                                      disabled={cancelReason.length < 15}
                                    >
                                      Confirmar Cancelamento
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotasEmitidas;