
import { SimpleUser } from '@/types/user';

export interface EditUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  role: string;
  profile_id: string;
  new_password: string;
}

export interface EditUserValidationErrors {
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  role?: string;
  profile_id?: string;
  new_password?: string;
  general?: string;
}

export interface UseEditUserFormProps {
  user: SimpleUser | null;
  userRole: string;
  onSuccess: () => void;
  onClose: () => void;
}
