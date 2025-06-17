
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExtratoTransacao } from "@/hooks/useExtratoConciliado";
import { useFinancialEntriesForReconciliation } from "@/hooks/useFinancialEntriesForReconciliation";

interface ReconciliationModalProps {
  open: boolean;
  onClose: () => void;
  transaction: ExtratoTransacao | null;
  onReconcile: (transactionId: string, entryId: string | null, createNew: boolean) => void;
  loading: boolean;
}

export default function ReconciliationModal({
  open,
  onClose,
  transaction,
  onReconcile,
  loading
}: ReconciliationModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { entries, findSimilarEntries } = useFinancialEntriesForReconciliation();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  if (!transaction) return null;

  const similarEntries = findSimilarEntries(transaction.valor, transaction.data, transaction.tipo);
  const filteredEntries = entries.filter(entry =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReconcile = (createNew: boolean = false) => {
    if (!transaction) return;
    onReconcile(transaction.id, selectedEntry, createNew);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conciliar Transação Bancária</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Detalhes da transação bancária */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Transação do Banco</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Data:</span>
                <p>{new Date(transaction.data).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Valor:</span>
                <p className={transaction.valor > 0 ? "text-green-600" : "text-red-600"}>
                  R$ {Math.abs(transaction.valor).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">Descrição:</span>
                <p>{transaction.descricao}</p>
              </div>
            </div>
          </div>

          {/* Sugestões automáticas */}
          {similarEntries.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                Sugestões Automáticas 
                <Badge variant="secondary" className="ml-2">{similarEntries.length}</Badge>
              </h3>
              <div className="space-y-2">
                {similarEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedEntry === entry.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedEntry(entry.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-gray-600">#{entry.entry_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {entry.amount.toLocaleString("pt-BR")}</p>
                        <p className="text-sm text-gray-600">{new Date(entry.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Busca de lançamentos */}
          <div>
            <h3 className="font-semibold mb-2">Buscar Lançamento Específico</h3>
            <Input
              placeholder="Buscar por descrição ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.slice(0, 10).map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`cursor-pointer ${
                        selectedEntry === entry.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedEntry(entry.id)}
                    >
                      <TableCell>{entry.entry_number}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>R$ {entry.amount.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{new Date(entry.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'receivable' ? 'default' : 'secondary'}>
                          {entry.type === 'receivable' ? 'Receber' : 'Pagar'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReconcile(true)}
              disabled={loading}
            >
              Criar Novo Lançamento
            </Button>
            <Button
              onClick={() => handleReconcile(false)}
              disabled={!selectedEntry || loading}
            >
              {loading ? "Conciliando..." : "Conciliar com Selecionado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
