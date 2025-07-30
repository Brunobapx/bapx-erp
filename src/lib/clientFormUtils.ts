/**
 * Utilitários para formulários de cliente
 */

export interface ClientFormData {
  type: string;
  cnpj: string;
  ie: string;
  cpf: string;
  rg: string;
  [key: string]: any;
}

/**
 * Detecta automaticamente o tipo de pessoa baseado nos dados existentes
 * - Se CNPJ estiver preenchido: tipo = 'Jurídica'
 * - Se CPF estiver preenchido: tipo = 'Física'
 * - Se ambos vazios: mantém tipo padrão 'Jurídica'
 */
export function detectPersonTypeFromData(formData: ClientFormData): ClientFormData {
  const updatedData = { ...formData };
  
  if (updatedData.cnpj && updatedData.cnpj.trim() !== '') {
    updatedData.type = 'Jurídica';
    // Limpa campos de pessoa física se CNPJ estiver preenchido
    updatedData.cpf = '';
    updatedData.rg = '';
  } else if (updatedData.cpf && updatedData.cpf.trim() !== '') {
    updatedData.type = 'Física';
    // Limpa campos de pessoa jurídica se CPF estiver preenchido
    updatedData.cnpj = '';
    updatedData.ie = '';
  }
  
  return updatedData;
}

/**
 * Aplica regra automática de tipo de pessoa baseado no preenchimento de CNPJ/CPF
 * - Se CNPJ for preenchido: tipo = 'Jurídica', limpa CPF/RG
 * - Se CPF for preenchido: tipo = 'Física', limpa CNPJ/IE
 */
export function applyPersonTypeRule(
  formData: ClientFormData, 
  fieldName: string, 
  fieldValue: string
): ClientFormData {
  const updatedData = { ...formData, [fieldName]: fieldValue };
  
  if (fieldName === 'cnpj' && fieldValue.trim() !== '') {
    updatedData.type = 'Jurídica';
    updatedData.cpf = '';
    updatedData.rg = '';
  } else if (fieldName === 'cpf' && fieldValue.trim() !== '') {
    updatedData.type = 'Física';
    updatedData.cnpj = '';
    updatedData.ie = '';
  }
  
  return updatedData;
}

/**
 * Aplica a regra para mudanças em CNPJ (para configurações da empresa)
 */
export function applyCNPJRule(
  formData: any,
  fieldName: string,
  fieldValue: string,
  cpfField: string = 'company_responsible_cpf'
): any {
  const updatedData = { ...formData, [fieldName]: fieldValue };
  
  if (fieldName.toLowerCase().includes('cnpj') && fieldValue.trim() !== '') {
    updatedData[cpfField] = '';
  }
  
  return updatedData;
}

/**
 * Aplica a regra para mudanças em CPF (para configurações da empresa)
 */
export function applyCPFRule(
  formData: any,
  fieldName: string,
  fieldValue: string,
  cnpjField: string = 'company_cnpj'
): any {
  const updatedData = { ...formData, [fieldName]: fieldValue };
  
  if (fieldName.toLowerCase().includes('cpf') && fieldValue.trim() !== '') {
    updatedData[cnpjField] = '';
  }
  
  return updatedData;
}