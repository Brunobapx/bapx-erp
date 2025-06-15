
import { z } from 'zod';
import { SecuritySetting } from './useSecuritySettings';

const sessionTimeoutSchema = z.number().min(5).max(1440);
const passwordLengthSchema = z.number().min(6).max(128);
const maxLoginAttemptsSchema = z.number().min(3).max(10);

export const validateSecuritySettings = (securitySettings: SecuritySetting[]) => {
  const errors: { [key: string]: string } = {};

  const sessionTimeout = securitySettings.find(s => s.key === 'session_timeout');
  if (sessionTimeout) {
    try {
      sessionTimeoutSchema.parse(sessionTimeout.value);
    } catch (error) {
      errors.session_timeout = 'Timeout deve estar entre 5 e 1440 minutos';
    }
  }

  const passwordLength = securitySettings.find(s => s.key === 'password_min_length');
  if (passwordLength) {
    try {
      passwordLengthSchema.parse(passwordLength.value);
    } catch (error) {
      errors.password_min_length = 'Comprimento deve estar entre 6 e 128 caracteres';
    }
  }

  const maxAttempts = securitySettings.find(s => s.key === 'max_login_attempts');
  if (maxAttempts) {
    try {
      maxLoginAttemptsSchema.parse(maxAttempts.value);
    } catch (error) {
      errors.max_login_attempts = 'Tentativas devem estar entre 3 e 10';
    }
  }

  return errors;
};
