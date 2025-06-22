
import { validateWithSecurity, userOperationSchemas } from '@/lib/enhancedValidation';
import { sanitizer } from '@/lib/sanitization';
import { UpdateUserData } from '../types';

export const validateUpdateUserData = (userData: UpdateUserData) => {
  return validateWithSecurity(
    userOperationSchemas.updateUser,
    {
      first_name: sanitizer.sanitizeText(userData.first_name),
      last_name: sanitizer.sanitizeText(userData.last_name),
      department: userData.department ? sanitizer.sanitizeText(userData.department) : undefined,
      position: userData.position ? sanitizer.sanitizeText(userData.position) : undefined,
      role: userData.role,
      profile_id: userData.profile_id,
      new_password: userData.new_password,
    },
    'update_user'
  );
};
