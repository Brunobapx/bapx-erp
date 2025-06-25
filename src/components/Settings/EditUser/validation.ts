
import { EditUserFormData, EditUserFormValidationErrors } from './types';

export const validateEditUserForm = (formData: EditUserFormData): EditUserFormValidationErrors => {
  const errors: EditUserFormValidationErrors = {};
  
  if (!formData.firstName.trim()) {
    errors.firstName = 'Nome é obrigatório';
  }
  
  if (!formData.lastName.trim()) {
    errors.lastName = 'Sobrenome é obrigatório';
  }
  
  if (!formData.email.trim()) {
    errors.email = 'Email é obrigatório';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!formData.role) {
    errors.role = 'Papel é obrigatório';
  }
  
  return errors;
};
