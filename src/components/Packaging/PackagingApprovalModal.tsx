
import { ApprovalModal } from '@/components/Modals/ApprovalModal';

type Props = {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  orderData: any;
  onApprove: (data: any) => Promise<void>;
  onNextStage: (data: any) => Promise<void>;
};

const PackagingApprovalModal = ({ isOpen, onClose, orderData, onApprove, onNextStage }: Props) => (
  <ApprovalModal
    isOpen={isOpen}
    onClose={onClose}
    stage="packaging"
    orderData={orderData || {
      id: 'NOVO',
      product_name: '',
      quantity_to_package: 1,
      customer: '',
      client_name: '',
      order_number: ''
    }}
    onApprove={onApprove}
    onNextStage={onNextStage}
  />
);

export default PackagingApprovalModal;
