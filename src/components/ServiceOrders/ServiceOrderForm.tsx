
import React, { useEffect, useState } from "react";
import { useServiceOrders, ServiceOrder, ServiceOrderMaterial } from "@/hooks/useServiceOrders";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Printer, Check } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const serviceTypes = ["Instalação", "Manutenção", "Suporte", "Outros"];
const priorities = ["Baixa", "Média", "Alta"];
const statusOptions = ["Aberta", "Em andamento", "Finalizada", "Cancelada"];

type Props = {
  order?: ServiceOrder;
  onSaved: () => void;
};

export const ServiceOrderForm: React.FC<Props> = ({ order, onSaved }) => {
  const { saveServiceOrder, isLoading } = useServiceOrders();
  const { clients, isLoading: clientsLoading } = useClients();
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const { products, loading: productsLoading } = useProducts();
  const [materials, setMaterials] = useState<ServiceOrderMaterial[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<number>(1);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [form, setForm] = useState<Partial<ServiceOrder>>(
    order || {
      opened_at: new Date().toISOString(),
      status: "Aberta",
      contract_service: false,
      service_type: "",
      priority: "Média",
      notes: ""
    }
  );
  const [saving, setSaving] = useState(false);

  // Buscar técnicos (usuários da função)
  useEffect(() => {
    async function fetchTechnicians() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "técnico");
      if (!error && Array.isArray(data)) {
        setTechnicians(
          data.map((t) => ({
            id: t.id,
            name: (t.first_name || "") + " " + (t.last_name || ""),
          }))
        );
      }
    }
    fetchTechnicians();
  }, []);

  // Carregar materiais se editando
  useEffect(() => {
    async function fetchMaterials() {
      if (!order) return;
      const { data, error } = await supabase
        .from("service_order_materials")
        .select("*, product:products(*)")
        .eq("service_order_id", order.id);
      if (!error && Array.isArray(data)) {
        setMaterials(
          data.map((m) => ({
            ...m,
            product: m.product,
          }))
        );
      }
    }
    fetchMaterials();
  }, [order]);

  // Adicionar material
  const addMaterial = async () => {
    if (!selectedProductId || selectedProductQuantity < 1) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    // Registrar material na ordem e descontar estoque
    const { data, error } = await supabase
      .from("service_order_materials")
      .insert([
        {
          service_order_id: order?.id,
          product_id: product.id,
          quantity: selectedProductQuantity,
          unit_value: product.price,
          subtotal: (product.price || 0) * selectedProductQuantity,
        },
      ])
      .select()
      .single();
    if (error) {
      toast.error("Erro ao adicionar material: " + error.message);
      return;
    }
    // Atualizar estoque do produto
    await supabase
      .from("products")
      .update({ stock: (product.stock || 0) - selectedProductQuantity })
      .eq("id", product.id);
    setMaterials((mats) => [
      ...mats,
      { ...data, product },
    ]);
    setSelectedProductId("");
    setSelectedProductQuantity(1);
    toast.success("Material adicionado!");
  };

  // Handle file upload (apenas simulado aqui)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAttachFiles(Array.from(e.target.files));
  };

  // Salvar ordem
  const handleSave = async () => {
    setSaving(true);
    const resp = await saveServiceOrder(form);
    setSaving(false);
    if (resp?.id) {
      onSaved();
    }
  };

  // Função para finalizar OS
  const handleFinish = async () => {
    if (!order?.id) return;
    await saveServiceOrder({ ...form, id: order.id, status: "Finalizada" });
    onSaved();
  };

  // Imprimir (simples: window.print)
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{order ? `Editar OS #${order.os_number}` : "Nova Ordem de Serviço"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Número da OS</Label>
            <Input value={order?.os_number || "Automático"} readOnly />
          </div>
          <div>
            <Label>Data de abertura</Label>
            <Input
              value={
                form.opened_at
                  ? new Date(form.opened_at).toLocaleString("pt-BR")
                  : ""
              }
              readOnly
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select
              value={form.client_id || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, client_id: v }))}
              disabled={clientsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem value={c.id} key={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Técnico responsável</Label>
            <Select
              value={form.technician_id || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, technician_id: v }))}
              disabled={technicians.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem value={t.id} key={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Restantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tipo de serviço</Label>
            <Select
              value={form.service_type || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, service_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select
              value={form.priority || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, priority: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade..." />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Situação</Label>
            <Select
              value={form.status || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Situação..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Descrição detalhada</Label>
          <Textarea
            value={form.description || ""}
            onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))}
            placeholder="Descreva detalhadamente o serviço..."
          />
        </div>
        {/* Materiais utilizados */}
        <div>
          <Label>Materiais utilizados</Label>
          <div className="flex gap-2 w-full">
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={productsLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Buscar material..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stock} em estoque)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              className="w-20"
              min={1}
              value={selectedProductQuantity}
              onChange={(e) => setSelectedProductQuantity(Number(e.target.value))}
            />
            <Button size="sm" onClick={addMaterial}>Adicionar</Button>
          </div>
          {/* Tabela materiais */}
          <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2">Produto</th>
                <th className="p-2">Qtd.</th>
                <th className="p-2">Valor unit.</th>
                <th className="p-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i}>
                  <td className="p-2">{m.product?.name}</td>
                  <td className="p-2">{m.quantity}</td>
                  <td className="p-2">R$ {Number(m.unit_value || 0).toFixed(2)}</td>
                  <td className="p-2 font-bold">R$ {Number(m.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="p-2 text-right font-bold">Total Materiais</td>
                <td className="p-2 font-bold">R$ {materials.reduce((s, m) => s + (Number(m.subtotal || 0)), 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        {/* Cobrança */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label>Serviço sob contrato?</Label>
            <Select
              value={form.contract_service ? "Sim" : "Não"}
              onValueChange={v => setForm(x => ({ ...x, contract_service: v === "Sim" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!form.contract_service && (
            <div className="flex flex-col space-y-2">
              <Label>Valor do serviço</Label>
              <Input
                type="number"
                min={0}
                value={form.service_value || ""}
                onChange={e => setForm(x => ({ ...x, service_value: Number(e.target.value) }))}
              />
            </div>
          )}
        </div>

        {/* Anexos */}
        <div>
          <Label>Anexos</Label>
          <Input type="file" multiple onChange={handleFileUpload} />
        </div>
        <div>
          <Label>Observações adicionais</Label>
          <Textarea
            value={form.notes || ""}
            onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
            placeholder="Observações extras..."
          />
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2" /> Imprimir OS
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Salvar OS
          </Button>
          {form.status === "Em andamento" && (
            <Button 
              variant="default" 
              onClick={handleFinish}
            >
              <Check className="mr-2" /> Finalizar OS
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
