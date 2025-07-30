import React, { useEffect, useState } from "react";
import { useServiceOrders, ServiceOrder, ServiceOrderMaterial } from "@/hooks/useServiceOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Printer, Check, Clock, AlertTriangle } from "lucide-react";

const serviceTypes = ["Instalação", "Manutenção", "Reparo", "Suporte", "Consultoria", "Outros"];
const priorities = ["Baixa", "Média", "Alta", "Crítica"];
const statusOptions = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"];

type Props = {
  order?: ServiceOrder;
  onSaved: () => void;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Crítica': return 'destructive';
    case 'Alta': return 'default';
    case 'Média': return 'secondary';
    case 'Baixa': return 'outline';
    default: return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Aberta': return 'destructive';
    case 'Em Andamento': return 'default';
    case 'Finalizada': return 'outline';
    case 'Cancelada': return 'secondary';
    default: return 'outline';
  }
};

const calculateTimeSinceOpened = (openedAt: string) => {
  const opened = new Date(openedAt);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - opened.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Menos de 1h';
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
};

export const ServiceOrderForm: React.FC<Props> = ({ order, onSaved }) => {
  const { saveServiceOrder } = useServiceOrders();
  const { clients, isLoading: clientsLoading } = useClients();
  const { products, loading: productsLoading } = useProducts();
  const serviceProducts = products.filter(p => (p as any).is_service === true);
  const { data: technicians } = useTechnicians();
  const { currentUserPosition } = useUserPositions();
  const { user } = useAuth();
  
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

  // Auto-preencher técnico se o usuário logado for técnico
  useEffect(() => {
    if (currentUserPosition === 'producao' && user && !order) {
      setForm(prev => ({
        ...prev,
        technician_id: user.id
      }));
    }
  }, [currentUserPosition, user, order]);

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

  // Adicionar material de serviço
  const addMaterial = async () => {
    if (!selectedProductId || selectedProductQuantity < 1) return;
    const product = serviceProducts.find((p) => p.id === selectedProductId);
    if (!product) return;
    
    // Registrar material na ordem
    const newMaterial = {
      id: Date.now().toString(),
      service_order_id: order?.id,
      product_id: product.id,
      quantity: selectedProductQuantity,
      unit_value: product.price,
      subtotal: (product.price || 0) * selectedProductQuantity,
      product: product,
    };

    setMaterials(prev => [...prev, newMaterial]);
    setSelectedProductId("");
    setSelectedProductQuantity(1);
    toast.success("Material de serviço adicionado!");
  };

  // Handle file upload (apenas simulado aqui)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAttachFiles(Array.from(e.target.files));
  };

  // Salvar ordem
  const handleSave = async () => {
    setSaving(true);
    try {
      const totalMaterialsCost = materials.reduce((sum, m) => sum + (Number(m.subtotal) || 0), 0);
      const serviceValue = form.service_value || 0;
      const totalValue = serviceValue + totalMaterialsCost;
      
      const orderData = {
        ...form,
        total_value: totalValue,
      };
      
      await saveServiceOrder(orderData);
      onSaved();
    } catch (error) {
      console.error('Erro ao salvar OS:', error);
    } finally {
      setSaving(false);
    }
  };

  // Função para finalizar OS
  const handleFinish = async () => {
    if (!order?.id) return;
    await saveServiceOrder({ ...form, id: order.id, status: "Finalizada" });
    onSaved();
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  const totalMaterialsCost = materials.reduce((sum, m) => sum + (Number(m.subtotal) || 0), 0);
  const serviceValue = form.service_value || 0;
  const totalValue = serviceValue + totalMaterialsCost;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {order ? `Editar OS #${order.os_number}` : "Nova Ordem de Serviço"}
            {order && (
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(order.priority || '')}>
                  {order.priority}
                </Badge>
                <Badge variant={getStatusColor(order.status || '')}>
                  {order.status}
                </Badge>
              </div>
            )}
          </CardTitle>
          {order && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {calculateTimeSinceOpened(order.opened_at)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Número da OS</Label>
            <Input value={order?.os_number || "Será gerado automaticamente"} readOnly />
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
            <Label>Cliente *</Label>
            <Select
              value={form.client_id || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, client_id: v }))}
              disabled={clientsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente..." />
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
            <Label>Técnico responsável *</Label>
            <Select
              value={form.technician_id || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, technician_id: v }))}
              disabled={!technicians?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o técnico..." />
              </SelectTrigger>
              <SelectContent>
                {technicians?.map((t) => (
                  <SelectItem value={t.id} key={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Detalhes do Serviço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo de serviço *</Label>
            <Select
              value={form.service_type || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, service_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
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
            <Label>Prioridade *</Label>
            <Select
              value={form.priority || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, priority: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade..." />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      {p === 'Crítica' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {p}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status || ""}
              onValueChange={(v) => setForm((x) => ({ ...x, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status..." />
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

        {/* Descrição */}
        <div>
          <Label>Descrição detalhada *</Label>
          <Textarea
            value={form.description || ""}
            onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))}
            placeholder="Descreva detalhadamente o problema e/ou serviço a ser realizado..."
            rows={4}
          />
        </div>

        {/* Materiais de Serviço */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Materiais/Produtos de Serviço</Label>
          <div className="flex gap-2 w-full">
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={productsLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar produto de serviço..." />
              </SelectTrigger>
              <SelectContent>
                {serviceProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - R$ {(p.price || 0).toFixed(2)}
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
              placeholder="Qtd"
            />
            <Button size="sm" onClick={addMaterial} disabled={!selectedProductId}>
              Adicionar
            </Button>
          </div>

          {/* Tabela de Materiais */}
          {materials.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Produto/Serviço</th>
                    <th className="p-3 text-center">Quantidade</th>
                    <th className="p-3 text-right">Valor Unitário</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{m.product?.name}</td>
                      <td className="p-3 text-center">{m.quantity}</td>
                      <td className="p-3 text-right">R$ {Number(m.unit_value || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">R$ {Number(m.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-bold">Total Materiais:</td>
                    <td className="p-3 text-right font-bold">R$ {totalMaterialsCost.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Valores e Cobrança */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <SelectItem value="Sim">Sim - Sem cobrança adicional</SelectItem>
                <SelectItem value="Não">Não - Cobrança avulsa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!form.contract_service && (
            <div>
              <Label>Valor do serviço (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.service_value || ""}
                onChange={e => setForm(x => ({ ...x, service_value: Number(e.target.value) }))}
                placeholder="0,00"
              />
            </div>
          )}
        </div>

        {/* Resumo de Valores */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Valor dos Materiais:</span>
              <span>R$ {totalMaterialsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor do Serviço:</span>
              <span>R$ {serviceValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Geral:</span>
              <span>R$ {totalValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Anexos e Observações */}
        <div className="space-y-4">
          <div>
            <Label>Anexos (fotos, documentos)</Label>
            <Input type="file" multiple onChange={handleFileUpload} />
            {attachFiles.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {attachFiles.length} arquivo(s) selecionado(s)
              </p>
            )}
          </div>
          <div>
            <Label>Observações adicionais</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))}
              placeholder="Observações extras, condições especiais, etc..."
              rows={3}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" /> Imprimir OS
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.client_id || !form.technician_id}
            className="flex-1"
          >
            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {order ? 'Atualizar OS' : 'Criar OS'}
          </Button>
          {order && form.status === "Em Andamento" && (
            <Button 
              variant="default" 
              onClick={handleFinish}
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" /> Finalizar OS
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};