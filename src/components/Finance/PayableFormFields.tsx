
import React from "react";
import { Input } from "@/components/ui/input";

type PayableFormFieldsProps = {
  description: string;
  amount: number;
  due_date: string;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
  onDueDateChange: (value: string) => void;
};

export const PayableFormFields: React.FC<PayableFormFieldsProps> = ({
  description,
  amount,
  due_date,
  onDescriptionChange,
  onAmountChange,
  onDueDateChange
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm mb-1" htmlFor="payable-desc">Descrição</label>
      <Input
        id="payable-desc"
        placeholder="Descrição"
        value={description}
        onChange={e => onDescriptionChange(e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm mb-1" htmlFor="payable-valor">Valor</label>
      <Input
        id="payable-valor"
        type="number"
        value={amount}
        onChange={e => onAmountChange(Number(e.target.value))}
      />
    </div>
    <div>
      <label className="block text-sm mb-1" htmlFor="payable-venc">Vencimento</label>
      <Input
        id="payable-venc"
        type="date"
        value={due_date ? due_date.substring(0, 10) : ""}
        onChange={e => onDueDateChange(e.target.value)}
      />
    </div>
  </div>
);
