import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, User } from "lucide-react";

interface FinalizarTrocaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recebidoPor: string) => void;
  numeroTroca?: string;
  loading?: boolean;
}

export function FinalizarTrocaModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  numeroTroca,
  loading = false 
}: FinalizarTrocaModalProps) {
  const [recebidoPor, setRecebidoPor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recebidoPor.trim()) {
      onConfirm(recebidoPor.trim());
      setRecebidoPor("");
    }
  };

  const handleClose = () => {
    setRecebidoPor("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finalizar Troca
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Finalizando troca:</p>
            <p className="font-semibold">{numeroTroca}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recebido-por" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome de quem recebeu a troca *
            </Label>
            <Input
              id="recebido-por"
              value={recebidoPor}
              onChange={(e) => setRecebidoPor(e.target.value)}
              placeholder="Digite o nome completo"
              disabled={loading}
              required
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
              type="submit"
              disabled={loading || !recebidoPor.trim()}
              className="flex-1"
            >
              {loading ? "Finalizando..." : "Finalizar Troca"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}