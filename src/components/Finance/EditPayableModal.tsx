
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define the type for Payable props
type EditPayableModalProps = {
  open: boolean;
  onClose: () => void;
  account: any;
  onSaved: () => void;
};

export const EditPayableModal: React.FC<EditPayableModalProps> = ({ open, onClose, account, onSaved }) => {
  const [description, setDescription] = useState(account?.description || "");
  const [amount, setAmount] = useState(account?.amount || 0);
  const [due_date, setDueDate] = useState(account?.due_date || "");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // reset fields when account changes
    setDescription(account?.description || "");
    setAmount(account?.amount || 0);
    setDueDate(account?.due_date || "");
  }, [account]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("accounts_payable")
      .update({
        description,
        amount,
        due_date,
        updated_at: new Date().toISOString()
      })
      .eq("id", account.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao atualizar lançamento");
    } else {
      toast.success("Lançamento atualizado com sucesso!");
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="payable-desc">Descrição</label>
            <Input
              id="payable-desc"
              placeholder="Descrição"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="payable-valor">Valor</label>
            <Input
              id="payable-valor"
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="payable-venc">Vencimento</label>
            <Input
              id="payable-venc"
              type="date"
              value={due_date ? due_date.substring(0, 10) : ""}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>
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
