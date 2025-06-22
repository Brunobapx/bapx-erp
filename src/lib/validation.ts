
import { z } from 'zod';

// Schema de validação para dados de usuário
export const userValidationSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Sobrenome deve conter apenas letras'),
  
  email: z.string()
    .email('Email inválido')
    .max(254, 'Email muito longo'),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  profileId: z.string()
    .uuid('ID do perfil inválido'),
});

export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 255); // Limita o tamanho
};

export const validateAndSanitizeUser = (data: any) => {
  // Sanitiza os dados de entrada
  const sanitizedData = {
    firstName: sanitizeUserInput(data.firstName || ''),
    lastName: sanitizeUserInput(data.lastName || ''),
    email: (data.email || '').trim().toLowerCase(),
    password: data.password || '',
    profileId: data.profileId || '',
  };

  // Valida os dados sanitizados
  return userValidationSchema.parse(sanitizedData);
};
