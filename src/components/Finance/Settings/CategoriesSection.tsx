
import React, { useState } from "react";
import { useFinancialCategories, FinancialCategory } from "@/hooks/useFinancialCategories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function CategoriesSection() {
  const { items, loading, upsertItem, deleteItem } = useFinancialCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "receita" as "receita" | "despesa",
    description: "",
    is_active: true as boolean
  });

  const openModal = (cat?: FinancialCategory) => {
    setForm({
      name: cat?.name ?? "",
      type: cat?.type ?? "receita",
      description: cat?.description ?? "",
      is_active: cat?.is_active ?? true,
    });
    setEditing(cat || null);
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
        <h4 className="font-semibold">Categorias de lançamento</h4>
        <Button size="sm" onClick={() => openModal()}>
          Nova Categoria
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-1 px-3">Nome</th>
              <th className="text-left py-1 px-3">Tipo</th>
              <th className="text-left py-1 px-3">Ativa</th>
              <th className="py-1 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((cat) => (
              <tr key={cat.id} className="border-b last:border-b-0">
                <td className="py-1 px-3">{cat.name}</td>
                <td className="py-1 px-3">{cat.type === "receita" ? "Receita" : "Despesa"}</td>
                <td className="py-1 px-3">
                  <span className={cat.is_active ? "text-green-600" : "text-red-600"}>
                    {cat.is_active ? "Sim" : "Não"}
                  </span>
                </td>
                <td className="py-1 px-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openModal(cat)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => cat.id && deleteItem(cat.id)}>
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted-foreground py-2">Nenhuma categoria cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="p-2 border rounded w-full" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
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
