
import { auditUserAction } from '@/lib/auditLogging';

export const logValidationFailed = (
  currentUserId: string,
  userEmail: string,
  targetUserId: string,
  errors: string[]
) => {
  auditUserAction(
    'update_user_validation_failed',
    currentUserId,
    userEmail,
    { targetUserId, validationErrors: errors },
    false,
    errors.join(', ')
  );
};

export const logUpdateSuccess = (
  currentUserId: string,
  userEmail: string,
  targetUserId: string,
  updatedFields: string[]
) => {
  auditUserAction(
    'update_user_success',
    currentUserId,
    userEmail,
    { targetUserId, updatedFields }
  );
};

export const logUpdateFailed = (
  currentUserId: string,
  userEmail: string,
  targetUserId: string,
  errorMessage: string
) => {
  auditUserAction(
    'update_user_failed',
    currentUserId,
    userEmail,
    { targetUserId, error: errorMessage },
    false,
    errorMessage
  );
};

export const logStatusUpdateSuccess = (
  currentUserId: string,
  userEmail: string,
  targetUserId: string,
  newStatus: boolean
) => {
  auditUserAction(
    'update_user_status',
    currentUserId,
    userEmail,
    { targetUserId, newStatus }
  );
};

export const logStatusUpdateFailed = (
  currentUserId: string,
  userEmail: string,
  targetUserId: string,
  errorMessage: string
) => {
  auditUserAction(
    'update_user_status_failed',
    currentUserId,
    userEmail,
    { targetUserId, error: errorMessage },
    false,
    errorMessage
  );
};
