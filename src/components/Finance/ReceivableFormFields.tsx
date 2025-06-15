
import React from "react";
import { Input } from "@/components/ui/input";

type ReceivableFormFieldsProps = {
  description: string;
  amount: number;
  dueDate: string;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
  onDueDateChange: (value: string) => void;
};

export const ReceivableFormFields: React.FC<ReceivableFormFieldsProps> = ({
  description,
  amount,
  dueDate,
  onDescriptionChange,
  onAmountChange,
  onDueDateChange
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm mb-1" htmlFor="receivable-desc">Descrição</label>
      <Input
        id="receivable-desc"
        placeholder="Descrição"
        value={description}
        onChange={e => onDescriptionChange(e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm mb-1" htmlFor="receivable-valor">Valor</label>
      <Input
        id="receivable-valor"
        type="number"
        value={amount}
        onChange={e => onAmountChange(Number(e.target.value))}
      />
    </div>
    <div>
      <label className="block text-sm mb-1" htmlFor="receivable-venc">Vencimento</label>
      <Input
        id="receivable-venc"
        type="date"
        value={dueDate ? dueDate.substring(0, 10) : ""}
        onChange={e => onDueDateChange(e.target.value)}
      />
    </div>
  </div>
);
