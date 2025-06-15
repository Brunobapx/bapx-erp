
import React, { useState } from "react";
import { usePaymentTerms, PaymentTerm } from "@/hooks/usePaymentTerms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PaymentTermsSection() {
  const { items, loading, upsertItem, deleteItem } = usePaymentTerms();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [form, setForm] = useState({
    name: "",
    days: 0,
    description: "",
    is_active: true as boolean,
  });

  const openModal = (pt?: PaymentTerm) => {
    setForm({
      name: pt?.name ?? "",
      days: pt?.days ?? 0,
      description: pt?.description ?? "",
      is_active: pt?.is_active ?? true,
    });
    setEditing(pt || null);
    setModalOpen(true);
  };

  const save = async () => {
    await upsertItem(form, editing?.id);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Prazos de pagamento</h4>
        <Button size="sm" onClick={() => openModal()}>
          Novo Prazo
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-1 px-3">Nome</th>
              <th className="text-left py-1 px-3">Dias</th>
              <th className="text-left py-1 px-3">Ativo</th>
              <th className="py-1 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((pt) => (
              <tr key={pt.id} className="border-b last:border-b-0">
                <td className="py-1 px-3">{pt.name}</td>
                <td className="py-1 px-3">{pt.days}</td>
                <td className="py-1 px-3">
                  <span className={pt.is_active ? "text-green-600" : "text-red-600"}>
                    {pt.is_active ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-1 px-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(pt)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => pt.id && deleteItem(pt.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted-foreground py-2">Nenhum prazo cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar prazo" : "Novo prazo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Dias</Label>
              <Input type="number" min={0} value={form.days} onChange={e => setForm(f => ({ ...f, days: parseInt(e.target.value) }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
