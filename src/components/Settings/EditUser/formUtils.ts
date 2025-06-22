
import { sanitizeTextInput } from '@/lib/userValidation';
import { EditUserFormData } from './types';

export const initializeFormData = (user: any): EditUserFormData => ({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  email: user?.email || '',
  department: user?.department || '',
  position: user?.position || '',
  role: user?.role || 'user',
  profile_id: user?.profile_id || '',
  new_password: ''
});

export const sanitizeFormField = (field: keyof EditUserFormData, value: string): string => {
  // Sanitizar entrada de texto
  return ['department', 'position'].includes(field) 
    ? sanitizeTextInput(value) 
    : value;
};
