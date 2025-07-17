import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Troca } from "@/hooks/useTrocas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisualizarTrocaModalProps {
  isOpen: boolean;
  onClose: () => void;
  troca: Troca | null;
}

export function VisualizarTrocaModal({ isOpen, onClose, troca }: VisualizarTrocaModalProps) {
  if (!troca) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'finalizada':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Finalizada</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Troca - {troca.numero_troca}
            {getStatusBadge((troca as any).status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <p className="text-sm">{troca.cliente?.name || 'Cliente não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Responsável</label>
              <p className="text-sm">{troca.responsavel}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data da Troca</label>
              <p className="text-sm">{formatDate(troca.data_troca)}</p>
            </div>
            {(troca as any).data_finalizacao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Finalização</label>
                <p className="text-sm">{formatDate((troca as any).data_finalizacao)}</p>
              </div>
            )}
            {(troca as any).recebido_por && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recebido por</label>
                <p className="text-sm">{(troca as any).recebido_por}</p>
              </div>
            )}
          </div>

          {troca.observacoes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observações Gerais</label>
              <p className="text-sm p-3 bg-muted rounded-lg">{troca.observacoes}</p>
            </div>
          )}

          <Separator />

          {/* Itens da Troca */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Itens da Troca</h3>
            <div className="space-y-4">
              {troca.troca_itens?.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Badge variant="outline">{item.quantidade} unidades</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Produto Devolvido</label>
                      <p className="text-sm">{item.produto_devolvido?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Produto Novo</label>
                      <p className="text-sm">{item.produto_novo?.name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Motivo</label>
                    <p className="text-sm">{item.motivo}</p>
                  </div>

                  {item.observacoes_item && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Observações do Item</label>
                      <p className="text-sm p-2 bg-muted rounded">{item.observacoes_item}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}