
import { 
  validateClientData, 
  isPersonalClient, 
  isBusinessClient,
  type PersonalClient,
  type BusinessClient 
} from '@/types/client';

describe('Client Types and Validation', () => {
  describe('validateClientData', () => {
    it('should validate personal client data successfully', () => {
      const data = {
        name: 'João Silva',
        type: 'PF' as const,
        cpf: '123.456.789-00',
        email: 'joao@example.com'
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should validate business client data successfully', () => {
      const data = {
        name: 'Empresa LTDA',
        type: 'PJ' as const,
        cnpj: '12.345.678/0001-90',
        email: 'contato@empresa.com'
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should require name', () => {
      const data = {
        name: '',
        type: 'PF' as const,
        cpf: '123.456.789-00'
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Nome/Razão Social é obrigatório');
    });

    it('should require CPF for personal clients', () => {
      const data = {
        name: 'João Silva',
        type: 'PF' as const,
        cpf: ''
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.cpf).toBe('CPF é obrigatório para Pessoa Física');
    });

    it('should require CNPJ for business clients', () => {
      const data = {
        name: 'Empresa LTDA',
        type: 'PJ' as const,
        cnpj: ''
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.cnpj).toBe('CNPJ é obrigatório para Pessoa Jurídica');
    });

    it('should validate email format', () => {
      const data = {
        name: 'João Silva',
        type: 'PF' as const,
        cpf: '123.456.789-00',
        email: 'invalid-email'
      };

      const result = validateClientData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email inválido');
    });
  });

  describe('Type Guards', () => {
    it('should identify personal client', () => {
      const client: PersonalClient = {
        id: '1',
        name: 'João Silva',
        type: 'PF',
        cpf: '123.456.789-00',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        company_id: 'company-1'
      };

      expect(isPersonalClient(client)).toBe(true);
      expect(isBusinessClient(client)).toBe(false);
    });

    it('should identify business client', () => {
      const client: BusinessClient = {
        id: '1',
        name: 'Empresa LTDA',
        type: 'PJ',
        cnpj: '12.345.678/0001-90',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        company_id: 'company-1'
      };

      expect(isBusinessClient(client)).toBe(true);
      expect(isPersonalClient(client)).toBe(false);
    });
  });
});
