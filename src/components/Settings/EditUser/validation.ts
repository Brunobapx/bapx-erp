
import { editUserSchema } from '@/lib/userValidation';
import { EditUserFormData, EditUserValidationErrors } from './types';

export const validateEditUserForm = (
  formData: EditUserFormData,
  userRole: string
): { isValid: boolean; errors: EditUserValidationErrors } => {
  const errors: EditUserValidationErrors = {};
  
  try {
    const validationData = {
      firstName: formData.first_name,
      lastName: formData.last_name,
      email: formData.email,
      profileId: formData.profile_id,
      role: formData.role,
      department: formData.department,
      position: formData.position,
      newPassword: formData.new_password
    };

    editUserSchema.parse(validationData);

    // Validações específicas de contexto
    if (userRole !== 'master' && formData.role === 'master') {
      errors.role = 'Apenas usuários master podem atribuir o papel master';
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path[0];
        // Mapear nomes dos campos
        const fieldMap: Record<string, keyof EditUserValidationErrors> = {
          firstName: 'first_name',
          lastName: 'last_name',
          profileId: 'profile_id',
          newPassword: 'new_password'
        };
        
        const mappedField = fieldMap[field] || field;
        errors[mappedField as keyof EditUserValidationErrors] = err.message;
      });
    }
    
    return { isValid: false, errors };
  }
};
