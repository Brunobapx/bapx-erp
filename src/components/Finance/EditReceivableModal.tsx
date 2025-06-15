
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReceivableFormFields } from "./ReceivableFormFields";

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
        <ReceivableFormFields
          description={description}
          amount={amount}
          dueDate={dueDate}
          onDescriptionChange={setDescription}
          onAmountChange={setAmount}
          onDueDateChange={setDueDate}
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
