import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVendorForm } from "./VendorModal/useVendorForm";

interface VendorModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  vendorData: any | null;
}
import VendorModalForm from "./VendorModal/VendorModalForm";

export const VendorModal = ({ isOpen, onClose, vendorData }: VendorModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{!vendorData?.id ? 'Novo Fornecedor' : 'Editar Fornecedor'}</DialogTitle>
        </DialogHeader>
        <VendorModalForm vendorData={vendorData} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};
