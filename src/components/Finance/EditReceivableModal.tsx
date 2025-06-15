
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define the type for Receivable props
type EditReceivableModalProps = {
  open: boolean;
  onClose: () => void;
  account: any;
  onSaved: () => void;
};

export const EditReceivableModal: React.FC<EditReceivableModalProps> = ({ open, onClose, account, onSaved }) => {
  const [description, setDescription] = useState(account?.description || "");
  const [amount, setAmount] = useState(account?.amount || 0);
  const [dueDate, setDueDate] = useState(account?.dueDate || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setDescription(account?.description || "");
    setAmount(account?.amount || 0);
    setDueDate(account?.dueDate || "");
  }, [account]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("financial_entries")
      .update({
        description,
        amount,
        due_date: dueDate,
        updated_at: new Date().toISOString()
      })
      .eq("id", account.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao atualizar recebível");
    } else {
      toast.success("Recebível atualizado com sucesso!");
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Descrição"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Input
            label="Valor"
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          />
          <Input
            label="Vencimento"
            type="date"
            value={dueDate ? dueDate.substring(0, 10) : ""}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={loading.toString()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
