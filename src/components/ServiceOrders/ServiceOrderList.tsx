import React, { useMemo, useState } from "react";
import { useServiceOrders, ServiceOrder } from "@/hooks/useServiceOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Eye, Edit, Check } from "lucide-react";

const statusOptions = ["Todos", "Aberta", "Em andamento", "Finalizada", "Cancelada"];

export const ServiceOrderList: React.FC<{
  onEdit?: (order: ServiceOrder) => void;
}> = ({ onEdit }) => {
  const { orders, isLoading, refetch } = useServiceOrders();
  const [status, setStatus] = useState("Todos");
  const [client, setClient] = useState("");
  const [technician, setTechnician] = useState("");
  const [search, setSearch] = useState("");

  // Filtros (dummy options - para popularizar: fetch clientes/técnicos de verdade)
  // Simples para demo; refatore para usar hooks de clientes e técnicos como no form
  const clientOptions = Array.from(
    new Set((orders || []).map((o) => o.client_id))
  );
  const technicianOptions = Array.from(
    new Set((orders || []).map((o) => o.technician_id))
  );
  
  const filteredOrders = useMemo(() => {
    let items = [...(orders || [])];
    if (status !== "Todos")
      items = items.filter((o) => o.status === status);
    if (client) items = items.filter((o) => o.client_id === client);
    if (technician) items = items.filter((o) => o.technician_id === technician);
    if (search)
      items = items.filter((o) =>
        o.os_number?.toLowerCase().includes(search.toLowerCase())
      );
    return items;
  }, [orders, status, client, technician, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordens de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar Nº OS"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-[180px]"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((st) => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientOptions.map((c) => (
                <SelectItem key={c} value={c || ""}>
                  {c || "-"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={technician} onValueChange={setTechnician}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              {technicianOptions.map((t) => (
                <SelectItem key={t} value={t || ""}>
                  {t || "-"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" onClick={() => refetch()}>
            <RefreshCw />
          </Button>
        </div>
        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2">Nº OS</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Data</th>
                <th className="p-2">Técnico</th>
                <th className="p-2">Situação</th>
                <th className="p-2">Valor total</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">Carregando...</td>
                  </tr>
                )
                : filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="p-2">{o.os_number}</td>
                    <td className="p-2">{o.client_id}</td>
                    <td className="p-2">{o.opened_at ? new Date(o.opened_at).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="p-2">{o.technician_id}</td>
                    <td className="p-2">{o.status}</td>
                    <td className="p-2 font-bold">R$ {(o.total_value || 0).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(o)} title="Ver/Editar">
                          <Eye />
                        </Button>
                        {o.status === "Em andamento" && (
                          <Button variant="ghost" size="icon">
                            <Check />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredOrders.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">Nenhuma OS encontrada.</div>
        )}
      </CardContent>
    </Card>
  );
};
