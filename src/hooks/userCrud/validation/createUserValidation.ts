
import { validateWithSecurity, userOperationSchemas } from '@/lib/enhancedValidation';
import { sanitizer } from '@/lib/sanitization';
import { CreateUserData } from '../types';

export const validateCreateUserData = (userData: CreateUserData) => {
  return validateWithSecurity(
    userOperationSchemas.createUser,
    {
      firstName: sanitizer.sanitizeText(userData.firstName),
      lastName: sanitizer.sanitizeText(userData.lastName),
      email: sanitizer.sanitizeEmail(userData.email),
      password: userData.password,
      role: userData.role,
      profileId: userData.profileId,
      department: userData.department ? sanitizer.sanitizeText(userData.department) : undefined,
      position: userData.position ? sanitizer.sanitizeText(userData.position) : undefined,
    },
    'create_user'
  );
};
