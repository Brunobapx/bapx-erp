
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PayableModalFormFields from "./PayableModalFormFields";
import { useNewPayableForm } from "./useNewPayableForm";

interface NewPayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NewPayableModal = ({ isOpen, onClose, onSuccess }: NewPayableModalProps) => {
  const {
    formData, setFormData, loading, handleSubmit,
    recorrente, setRecorrente, frequencia, setFrequencia, qtdRepeticoes, setQtdRepeticoes,
    selectedVendorId, selectedVendorName, handleVendorSelect,
    accounts, accountsLoading, financialCategories, categoriesLoading
  } = useNewPayableForm(isOpen, onClose, onSuccess);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PayableModalFormFields
            formData={formData}
            setFormData={setFormData}
            selectedVendorId={selectedVendorId}
            selectedVendorName={selectedVendorName}
            handleVendorSelect={handleVendorSelect}
            accounts={accounts}
            accountsLoading={accountsLoading}
            financialCategories={financialCategories}
            categoriesLoading={categoriesLoading}
            recorrente={recorrente}
            setRecorrente={setRecorrente}
            frequencia={frequencia}
            setFrequencia={setFrequencia}
            qtdRepeticoes={qtdRepeticoes}
            setQtdRepeticoes={setQtdRepeticoes}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewPayableModal;
