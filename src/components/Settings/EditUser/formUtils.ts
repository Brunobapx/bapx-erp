
import { sanitizeTextInput } from '@/lib/userValidation';
import { EditUserFormData } from './types';

export const initializeFormData = (user: any): EditUserFormData => ({
  firstName: user?.first_name || '',
  lastName: user?.last_name || '',
  email: user?.email || '',
  department: user?.department || '',
  position: user?.position || '',
  role: user?.role || 'user',
  profileId: user?.profile_id || '',
  isActive: user?.is_active ?? true,
});

export const sanitizeFormField = (field: keyof EditUserFormData, value: string): string => {
  // Sanitizar entrada de texto
  return ['department', 'position'].includes(field) 
    ? sanitizeTextInput(value) 
    : value;
};
