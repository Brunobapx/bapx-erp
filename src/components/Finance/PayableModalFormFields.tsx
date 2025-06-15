import React from 'react';
import VendorSelector from "./VendorSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PayableRecurrenceFields from "./PayableRecurrenceFields";
import PayableBankAccountSelect from "./PayableBankAccountSelect";

type Props = {
  formData: any;
  setFormData: (cb: (prev: any) => any) => void;
  selectedVendorId: string | undefined;
  selectedVendorName: string;
  handleVendorSelect: (id: string, name: string) => void;
  accounts: any[];
  accountsLoading: boolean;
  financialCategories: any[];
  categoriesLoading: boolean;
  recorrente: boolean;
  setRecorrente: (v: boolean) => void;
  frequencia: Frequencia;
  setFrequencia: (v: Frequencia) => void;
  qtdRepeticoes: number;
  setQtdRepeticoes: (v: number) => void;
};

const PayableModalFormFields: React.FC<Props> = ({
  formData, setFormData,
  selectedVendorId, selectedVendorName, handleVendorSelect,
  accounts, accountsLoading,
  financialCategories, categoriesLoading,
  recorrente, setRecorrente, frequencia, setFrequencia, qtdRepeticoes, setQtdRepeticoes
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Fornecedor *</Label>
          <VendorSelector
            selectedVendorId={selectedVendorId}
            selectedVendorName={selectedVendorName}
            onSelect={handleVendorSelect}
          />
        </div>
        <div>
          <Label htmlFor="invoice">Número da NF/Documento</Label>
          <Input
            id="invoice"
            value={formData.invoice_number}
            onChange={(e) => setFormData((f: any) => ({ ...f, invoice_number: e.target.value }))}
            placeholder="Número da NF/Documento"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            value={formData.amount}
            onChange={(e) => setFormData((f: any) => ({ ...f, amount: e.target.value.replace(',', '.') }))}
            placeholder="0,00"
            required
            autoComplete="off"
            pattern="[0-9]*[.,]?[0-9]*"
          />
        </div>
        <PayableBankAccountSelect
          value={formData.account}
          onValueChange={val => setFormData((f: any) => ({ ...f, account: val }))}
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((f: any) => ({ ...f, description: e.target.value }))}
          placeholder="Descrição da conta"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="due_date">Vencimento *</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData((f: any) => ({ ...f, due_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((f: any) => ({ ...f, category: value }))
            }
            disabled={categoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={categoriesLoading ? "Carregando categorias..." : "Selecione a categoria"} />
            </SelectTrigger>
            <SelectContent>
              {financialCategories
                .filter(cat => cat.type === "despesa" && cat.is_active)
                .map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((f: any) => ({ ...f, notes: e.target.value }))}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>
      <PayableRecurrenceFields
        recorrente={recorrente}
        setRecorrente={setRecorrente}
        frequencia={frequencia}
        setFrequencia={setFrequencia}
        qtdRepeticoes={qtdRepeticoes}
        setQtdRepeticoes={setQtdRepeticoes}
      />
      {/* Preview das parcelas (se recorrente e mais de 1 repetição) */}
      {recorrente && qtdRepeticoes > 1 && (
        <div className="mt-2 text-xs text-muted-foreground border rounded bg-gray-50 p-2">
          <b>As contas serão lançadas assim:</b>
          <ul className="list-disc ml-6 mt-1">
            {Array.from({ length: qtdRepeticoes }).map((_, idx) => (
              <li key={idx}>
                {formData.description || "Descrição"} - Parcela {idx + 1}/{qtdRepeticoes}
                {formData.invoice_number && (
                  <> {'| NF: '}{formData.invoice_number}-{idx + 1}/{qtdRepeticoes}</>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default PayableModalFormFields;
