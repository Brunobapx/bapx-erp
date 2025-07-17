import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import { Troca } from "@/hooks/useTrocas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GerarRomaneioModalProps {
  isOpen: boolean;
  onClose: () => void;
  troca: Troca | null;
}

export function GerarRomaneioModal({ isOpen, onClose, troca }: GerarRomaneioModalProps) {
  const [observacoesRomaneio, setObservacoesRomaneio] = useState("");
  const [loading, setLoading] = useState(false);

  if (!troca) return null;

  const gerarRomaneio = async () => {
    setLoading(true);
    try {
      // Simular geração de romaneio
      const content = `
ROMANEIO DE TROCA - ${troca.numero_troca}

Data: ${format(new Date(troca.data_troca), "dd/MM/yyyy", { locale: ptBR })}
Cliente: ${troca.cliente?.name || 'Não informado'}
Responsável: ${troca.responsavel}

ITENS TROCADOS:
${troca.troca_itens?.map((item, index) => `
${index + 1}. Produto Devolvido: ${item.produto_devolvido?.name}
   Produto Novo: ${item.produto_novo?.name}
   Quantidade: ${item.quantidade}
   Motivo: ${item.motivo}
   ${item.observacoes_item ? `Observações: ${item.observacoes_item}` : ''}
`).join('\n')}

${troca.observacoes ? `Observações Gerais: ${troca.observacoes}` : ''}
${observacoesRomaneio ? `Observações do Romaneio: ${observacoesRomaneio}` : ''}

_______________________________________________
Assinatura do Responsável

_______________________________________________
Assinatura do Cliente
      `;

      // Criar arquivo para download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `romaneio-${troca.numero_troca}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      onClose();
      setObservacoesRomaneio("");
    } catch (error) {
      console.error('Erro ao gerar romaneio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObservacoesRomaneio("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Gerar Romaneio - {troca.numero_troca}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm"><strong>Cliente:</strong> {troca.cliente?.name || 'Não informado'}</p>
            <p className="text-sm"><strong>Data:</strong> {format(new Date(troca.data_troca), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p className="text-sm"><strong>Itens:</strong> {troca.troca_itens?.length || 0} item(s)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes-romaneio">
              Observações do Romaneio (opcional)
            </Label>
            <Textarea
              id="observacoes-romaneio"
              value={observacoesRomaneio}
              onChange={(e) => setObservacoesRomaneio(e.target.value)}
              placeholder="Adicione observações específicas para o romaneio..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={gerarRomaneio}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                "Gerando..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Romaneio
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}