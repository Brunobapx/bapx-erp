
import React, { useState } from "react";
import ExtratoUpload from "./ExtratoUpload";
import ReconciliationModal from "./ReconciliationModal";
import { useExtratoConciliado, ExtratoTransacao } from "@/hooks/useExtratoConciliado";
import { useConciliacoes } from "@/hooks/useConciliacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtratoTransacao | null>(null);
  
  const { transacoes, loading, error, refreshExtrato } = useExtratoConciliado();
  const { conciliarComLancamento, conciliarCriandoLancamento, desconciliar, criandoLancamento } = useConciliacoes();

  // Aplicar filtros
  const filtered = transacoes.filter(t =>
    (search === "" || t.descricao.toLowerCase().includes(search.toLowerCase()))
    && (status === "" || t.status === status)
    && (tipo === "" || t.tipo === tipo)
  );

  const handleOpenModal = (transaction: ExtratoTransacao) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleReconcile = async (transactionId: string, entryId: string | null, createNew: boolean) => {
    const transaction = transacoes.find(t => t.id === transactionId);
    if (!transaction) return;

    if (createNew) {
      await conciliarCriandoLancamento(transaction);
    } else if (entryId) {
      await conciliarComLancamento(transactionId, entryId);
    }
    
    refreshExtrato();
  };

  const handleDesconciliar = async (transactionId: string) => {
    await desconciliar(transactionId);
    refreshExtrato();
  };

  // Estatísticas
  const stats = {
    total: transacoes.length,
    conciliadas: transacoes.filter(t => t.status === 'conciliado').length,
    pendentes: transacoes.filter(t => t.status === 'nao_conciliado').length,
    valorTotal: transacoes.reduce((sum, t) => sum + Number(t.valor), 0),
    valorConciliado: transacoes
      .filter(t => t.status === 'conciliado')
      .reduce((sum, t) => sum + Number(t.valor), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Conciliação Bancária</h2>
        <ExtratoUpload onFinish={refreshExtrato} />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total de Transações</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Conciliadas</h3>
          <p className="text-2xl font-bold text-green-900">{stats.conciliadas}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Pendentes</h3>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Valor Conciliado</h3>
          <p className="text-2xl font-bold text-purple-900">
            R$ {stats.valorConciliado.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input 
          className="w-64" 
          placeholder="Busca por descrição..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <select 
          className="border rounded px-2 py-1" 
          value={status} 
          onChange={e => setStatus(e.target.value)}
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select 
          className="border rounded px-2 py-1" 
          value={tipo} 
          onChange={e => setTipo(e.target.value)}
        >
          {tipoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button type="button" variant="outline" onClick={refreshExtrato}>
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando transações...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {transacoes.length === 0 
                    ? "Nenhuma transação importada. Faça o upload de um arquivo CSV." 
                    : "Nenhuma transação encontrada com os filtros aplicados."
                  }
                </TableCell>
              </TableRow>
            )}
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell>{new Date(t.data).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-xs truncate">{t.descricao}</TableCell>
                <TableCell>
                  <span className={t.valor > 0 ? "text-green-600" : "text-red-600"}>
                    R$ {Math.abs(Number(t.valor)).toLocaleString("pt-BR")}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={t.tipo === "credito" ? "default" : "secondary"}>
                    {t.tipo === "credito" ? "Crédito" : "Débito"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.status === "conciliado"
                        ? "default"
                        : t.status === "em_processamento"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {t.status === "conciliado" ? "Conciliado" :
                     t.status === "em_processamento" ? "Processando" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {t.status === "conciliado" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDesconciliar(t.id)}
                      >
                        Desconciliar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={criandoLancamento}
                        onClick={() => handleOpenModal(t)}
                      >
                        Conciliar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg">
          Erro: {error}
        </div>
      )}

      <ReconciliationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={selectedTransaction}
        onReconcile={handleReconcile}
        loading={criandoLancamento}
      />
    </div>
  );
}
