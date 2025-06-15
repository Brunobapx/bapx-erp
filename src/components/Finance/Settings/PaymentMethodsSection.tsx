
import React, { useState } from "react";
import { usePaymentMethods, PaymentMethod } from "@/hooks/usePaymentMethods";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function PaymentMethodsSection() {
  const { items, loading, upsertItem, deleteItem } = usePaymentMethods();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true as boolean,
  });

  const openModal = (pm?: PaymentMethod) => {
    setForm({
      name: pm?.name ?? "",
      description: pm?.description ?? "",
      is_active: pm?.is_active ?? true,
    });
    setEditing(pm || null);
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
        <h4 className="font-semibold">Formas de pagamento</h4>
        <Button size="sm" onClick={() => openModal()}>
          Nova Forma
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-1 px-3">Nome</th>
              <th className="text-left py-1 px-3">Ativa</th>
              <th className="py-1 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((pm) => (
              <tr key={pm.id} className="border-b last:border-b-0">
                <td className="py-1 px-3">{pm.name}</td>
                <td className="py-1 px-3">
                  <span className={pm.is_active ? "text-green-600" : "text-red-600"}>
                    {pm.is_active ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-1 px-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(pm)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => pm.id && deleteItem(pm.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted-foreground py-2">Nenhuma forma cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar forma" : "Nova forma"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Ativa</Label>
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
