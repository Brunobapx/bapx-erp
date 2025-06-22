
import { z } from 'zod';

// Schema mais robusto para validação de usuários
export const createUserSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras, espaços, hífens e apostrofes')
    .transform(str => str.trim()),
  
  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(50, 'Sobrenome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Sobrenome deve conter apenas letras, espaços, hífens e apostrofes')
    .transform(str => str.trim()),
  
  email: z.string()
    .email('Email inválido')
    .max(254, 'Email muito longo')
    .transform(str => str.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  profileId: z.string()
    .uuid('ID do perfil inválido'),
  
  role: z.enum(['user', 'admin', 'master'], {
    errorMap: () => ({ message: 'Papel inválido' })
  }).optional().default('user'),
  
  department: z.string()
    .max(100, 'Departamento deve ter no máximo 100 caracteres')
    .optional()
    .transform(str => str?.trim()),
  
  position: z.string()
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .optional()
    .transform(str => str?.trim()),
});

export const editUserSchema = createUserSchema.omit({ password: true }).extend({
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .max(128, 'Nova senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número')
    .optional()
    .or(z.literal('')),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type EditUserData = z.infer<typeof editUserSchema>;

// Função para sanitizar entrada de texto
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 255); // Limita o tamanho
};

// Validação específica para campos de texto livre
export const validateTextInput = (input: string, fieldName: string): string[] => {
  const errors: string[] = [];
  
  if (input.length > 255) {
    errors.push(`${fieldName} deve ter no máximo 255 caracteres`);
  }
  
  if (/<script|javascript:|onload=|onerror=/i.test(input)) {
    errors.push(`${fieldName} contém conteúdo não permitido`);
  }
  
  return errors;
};
