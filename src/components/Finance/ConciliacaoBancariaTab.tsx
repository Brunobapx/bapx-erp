
import React, { useState } from "react";
import ExtratoUpload from "./ExtratoUpload";
import { useExtratoConciliado } from "@/hooks/useExtratoConciliado";
import { useConciliacoes } from "@/hooks/useConciliacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Filtros: busca texto, status, tipo
const statusOptions = [
  { value: "", label: "Todos" },
  { value: "nao_conciliado", label: "Não conciliado" },
  { value: "conciliado", label: "Conciliado" },
  { value: "em_processamento", label: "Em processamento" },
];

const tipoOptions = [
  { value: "", label: "Todos" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
];

export default function ConciliacaoBancariaTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const { transacoes, loading, error, refreshExtrato } = useExtratoConciliado();
  const { conciliarManual, criandoLancamento } = useConciliacoes();

  // Aplicar filtros
  const filtered = transacoes.filter(t =>
    (search === "" || t.descricao.toLowerCase().includes(search.toLowerCase()))
    && (status === "" || t.status === status)
    && (tipo === "" || t.tipo === tipo)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-2">Conciliação bancária</h2>

      <ExtratoUpload onFinish={refreshExtrato} />

      <div className="flex flex-wrap gap-2 items-center">
        <Input className="w-64" placeholder="Busca por descrição..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="border rounded px-2 py-1" value={tipo} onChange={e => setTipo(e.target.value)}>
          {tipoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button type="button" variant="outline" onClick={refreshExtrato}>
          Atualizar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={6}>Carregando...</TableCell>
            </TableRow>
          )}
          {filtered.map(t => (
            <TableRow key={t.id}>
              <TableCell>{new Date(t.data).toLocaleDateString()}</TableCell>
              <TableCell>{t.descricao}</TableCell>
              <TableCell>R$ {Number(t.valor).toLocaleString("pt-BR")}</TableCell>
              <TableCell>{t.tipo === "credito" ? "Crédito" : "Débito"}</TableCell>
              <TableCell>
                <span className={
                  t.status === "conciliado"
                    ? "bg-green-100 text-green-600 px-2 rounded"
                    : t.status === "em_processamento"
                      ? "bg-yellow-100 text-yellow-600 px-2 rounded"
                      : "bg-gray-100 text-gray-800 px-2 rounded"
                }>
                  {t.status}
                </span>
              </TableCell>
              <TableCell>
                {t.status === "conciliado" ? (
                  "Conciliado"
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={criandoLancamento}
                    onClick={() => conciliarManual(t)}
                  >
                    Marcar Conciliado / Vincular
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => conciliarManual(t, true)}
                >
                  Criar Lançamento
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!loading && filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8">
          Nenhuma transação encontrada.
        </div>
      )}
      {error && (
        <div className="text-red-600">{error}</div>
      )}
    </div>
  );
}
