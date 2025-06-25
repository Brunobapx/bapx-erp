
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

export interface EditUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  profileId: string;
  isActive: boolean;
}

export interface EditUserFormValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  position?: string;
  role?: string;
  profileId?: string;
}

export interface EditUserFormProps {
  user: UnifiedUser;
  form: EditUserFormData;
  validationErrors: EditUserFormValidationErrors;
  loading: boolean;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  userRole: string;
  onFieldChange: (field: string, value: string | boolean) => void;
  onSubmit: () => void;
}

export interface EditUserModalProps {
  user: UnifiedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  userRole: string;
}
