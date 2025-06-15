
import React, { useState } from "react";
import { useFinancialAccounts, FinancialAccount } from "@/hooks/useFinancialAccounts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AccountsSection() {
  const { items, loading, upsertItem, deleteItem } = useFinancialAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const [form, setForm] = useState({
    name: "",
    account_type: "corrente" as "corrente" | "poupanca" | "caixa",
    bank: "",
    agency: "",
    account_number: "",
    initial_balance: 0,
    is_active: true as boolean,
  });

  const openModal = (acc?: FinancialAccount) => {
    setForm({
      name: acc?.name ?? "",
      account_type: acc?.account_type ?? "corrente",
      bank: acc?.bank ?? "",
      agency: acc?.agency ?? "",
      account_number: acc?.account_number ?? "",
      initial_balance: acc?.initial_balance ?? 0,
      is_active: acc?.is_active ?? true,
    });
    setEditing(acc || null);
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
        <h4 className="font-semibold">Contas bancárias/Caixa</h4>
        <Button size="sm" onClick={() => openModal()}>
          Nova Conta
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-1 px-3">Nome</th>
              <th className="text-left py-1 px-3">Tipo</th>
              <th className="text-left py-1 px-3">Banco</th>
              <th className="text-left py-1 px-3">Ativa</th>
              <th className="py-1 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((acc) => (
              <tr key={acc.id} className="border-b last:border-b-0">
                <td className="py-1 px-3">{acc.name}</td>
                <td className="py-1 px-3">{acc.account_type}</td>
                <td className="py-1 px-3">{acc.bank ?? "-"}</td>
                <td className="py-1 px-3">
                  <span className={acc.is_active ? "text-green-600" : "text-red-600"}>
                    {acc.is_active ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-1 px-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(acc)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => acc.id && deleteItem(acc.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-2">Nenhuma conta cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="p-2 border rounded w-full" value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value as any }))}>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="caixa">Caixa</option>
              </select>
            </div>
            <div>
              <Label>Banco</Label>
              <Input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
            </div>
            <div>
              <Label>Agência</Label>
              <Input value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} />
            </div>
            <div>
              <Label>Número da Conta</Label>
              <Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
            </div>
            <div>
              <Label>Saldo Inicial</Label>
              <Input type="number" value={form.initial_balance} onChange={e => setForm(f => ({ ...f, initial_balance: parseFloat(e.target.value) }))} min={0} />
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
