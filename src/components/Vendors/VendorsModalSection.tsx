
import { VendorModal } from '@/components/Modals/VendorModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  showModal: boolean;
  setShowModal: (b: boolean) => void;
  selectedVendor: any;
  handleModalClose: (refresh?: boolean) => void;
  vendorToDelete: string | null;
  setVendorToDelete: (id: string | null) => void;
  handleDeleteVendor: () => void;
  isDeleting: boolean;
};

const VendorsModalSection = ({
  showModal,
  setShowModal,
  selectedVendor,
  handleModalClose,
  vendorToDelete,
  setVendorToDelete,
  handleDeleteVendor,
  isDeleting
}: Props) => (
  <>
    <VendorModal
      isOpen={showModal}
      onClose={handleModalClose}
      vendorData={selectedVendor || null}
    />
    <AlertDialog open={!!vendorToDelete} onOpenChange={() => setVendorToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteVendor}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
);

export default VendorsModalSection;
