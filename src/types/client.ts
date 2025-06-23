
export interface BaseClient {
  id: string;
  name: string;
  type: ClientType;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  company_id: string;
}

export interface PersonalClient extends BaseClient {
  type: 'PF';
  cpf: string;
  rg?: string | null;
  cnpj?: never;
  ie?: never;
}

export interface BusinessClient extends BaseClient {
  type: 'PJ';
  cnpj: string;
  ie?: string | null;
  cpf?: never;
  rg?: never;
}

export type Client = PersonalClient | BusinessClient;

export type ClientType = 'PF' | 'PJ';

export interface ClientAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  bairro?: string | null;
  number?: string | null;
  complement?: string | null;
}

export interface ClientWithAddress extends Client, ClientAddress {}

export interface CreateClientData {
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  cnpj?: string;
  ie?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  bairro?: string;
  number?: string;
  complement?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export interface ClientFilters {
  searchTerm?: string;
  type?: ClientType;
  city?: string;
  state?: string;
}

export interface ClientValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Type guards
export const isPersonalClient = (client: Client): client is PersonalClient => {
  return client.type === 'PF';
};

export const isBusinessClient = (client: Client): client is BusinessClient => {
  return client.type === 'PJ';
};

// Validation schemas
export const validateClientData = (data: CreateClientData): ClientValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Nome/Razão Social é obrigatório';
  }

  if (data.type === 'PF') {
    if (!data.cpf?.trim()) {
      errors.cpf = 'CPF é obrigatório para Pessoa Física';
    }
  } else if (data.type === 'PJ') {
    if (!data.cnpj?.trim()) {
      errors.cnpj = 'CNPJ é obrigatório para Pessoa Jurídica';
    }
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Email inválido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
