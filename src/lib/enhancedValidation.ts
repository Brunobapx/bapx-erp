
import { z } from 'zod';
import { sanitizeTextInput } from './userValidation';

// Validações mais rigorosas para diferentes tipos de dados
export const securityValidationSchemas = {
  // Validação de email mais rigorosa
  email: z.string()
    .email('Email inválido')
    .max(254, 'Email muito longo')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato de email inválido')
    .transform(str => str.toLowerCase().trim()),

  // Validação de senha mais forte
  strongPassword: z.string()
    .min(12, 'Senha deve ter pelo menos 12 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),

  // Validação de texto com sanitização
  sanitizedText: z.string()
    .max(1000, 'Texto muito longo')
    .transform(sanitizeTextInput)
    .refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Conteúdo não permitido detectado'),

  // Validação de UUID
  uuid: z.string()
    .uuid('ID inválido')
    .transform(str => str.toLowerCase()),

  // Validação de números positivos
  positiveInteger: z.number()
    .int('Deve ser um número inteiro')
    .positive('Deve ser um número positivo')
    .max(2147483647, 'Número muito grande'),

  // Validação de URL
  url: z.string()
    .url('URL inválida')
    .max(2000, 'URL muito longa')
    .refine(url => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'Protocolo de URL não permitido'),

  // Validação de telefone
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]{8,20}$/, 'Formato de telefone inválido')
    .transform(str => str.replace(/[^\d+]/g, '')),

  // Validação de CPF
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'Formato de CPF inválido')
    .refine(cpf => {
      const cleanCPF = cpf.replace(/[^\d]/g, '');
      if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
      
      let sum = 0;
      for (let i = 1; i <= 9; i++) sum += parseInt(cleanCPF[i-1]) * (11 - i);
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cleanCPF[9])) return false;

      sum = 0;
      for (let i = 1; i <= 10; i++) sum += parseInt(cleanCPF[i-1]) * (12 - i);
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder === parseInt(cleanCPF[10]);
    }, 'CPF inválido')
};

// Função para validar dados com logs de segurança
export const validateWithSecurity = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    console.log(`[SECURITY] Validação bem-sucedida: ${context}`);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      console.warn(`[SECURITY] Falha na validação: ${context}`, errors);
      return { success: false, errors };
    }
    console.error(`[SECURITY] Erro de validação inesperado: ${context}`, error);
    return { success: false, errors: ['Erro de validação interno'] };
  }
};

// Schemas específicos para operações do sistema
export const userOperationSchemas = {
  createUser: z.object({
    firstName: securityValidationSchemas.sanitizedText.min(2, 'Nome deve ter pelo menos 2 caracteres'),
    lastName: securityValidationSchemas.sanitizedText.min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
    email: securityValidationSchemas.email,
    password: securityValidationSchemas.strongPassword,
    profileId: securityValidationSchemas.uuid,
    role: z.enum(['user', 'admin', 'master']).default('user'),
    department: securityValidationSchemas.sanitizedText.optional(),
    position: securityValidationSchemas.sanitizedText.optional(),
  }),

  updateUser: z.object({
    first_name: securityValidationSchemas.sanitizedText.min(2, 'Nome deve ter pelo menos 2 caracteres'),
    last_name: securityValidationSchemas.sanitizedText.min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
    department: securityValidationSchemas.sanitizedText.optional(),
    position: securityValidationSchemas.sanitizedText.optional(),
    role: z.enum(['user', 'admin', 'master']).optional(),
    profile_id: securityValidationSchemas.uuid.optional(),
    new_password: securityValidationSchemas.strongPassword.optional(),
  }),

  login: z.object({
    email: securityValidationSchemas.email,
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
};
