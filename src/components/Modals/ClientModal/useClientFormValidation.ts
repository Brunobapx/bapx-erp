
import { toast } from "sonner";

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const cpfClean = cpf.replace(/[^\d]/g, '');
  
  if (cpfClean.length !== 11) return false;
  
  // Verificar sequências inválidas
  if (/^(\d)\1{10}$/.test(cpfClean)) return false;
  
  // Calcular dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpfClean[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpfClean[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return (
    parseInt(cpfClean[9]) === digit1 &&
    parseInt(cpfClean[10]) === digit2
  );
}

// Função para validar CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cnpjClean = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjClean.length !== 14) return false;
  
  // Calcular primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(cnpjClean[i]) * weights1[i];
  }
  let digit1 = sum1 % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  // Calcular segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(cnpjClean[i]) * weights2[i];
  }
  let digit2 = sum2 % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return (
    parseInt(cnpjClean[12]) === digit1 &&
    parseInt(cnpjClean[13]) === digit2
  );
}

// Função para sanitizar entrada e prevenir XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateClientForm(formData: any) {
  // Sanitizar entradas de texto
  const sanitizedData = {
    ...formData,
    name: sanitizeInput(formData.name || ''),
    email: sanitizeInput(formData.email || ''),
    address: sanitizeInput(formData.address || ''),
    city: sanitizeInput(formData.city || ''),
    state: sanitizeInput(formData.state || ''),
  };

  if (!sanitizedData.name.trim()) {
    toast.error("Nome/Razão Social é obrigatório");
    return false;
  }

  // Validação de comprimento para prevenir ataques
  if (sanitizedData.name.length > 255) {
    toast.error("Nome muito longo (máximo 255 caracteres)");
    return false;
  }

  if (formData.type === 'Jurídica') {
    if (!formData.cnpj.trim()) {
      toast.error("CNPJ é obrigatório para Pessoa Jurídica");
      return false;
    }
    
    if (!validateCNPJ(formData.cnpj)) {
      toast.error("CNPJ inválido. Verifique os dígitos informados.");
      return false;
    }
  }

  if (formData.type === 'Física') {
    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório para Pessoa Física");
      return false;
    }
    
    if (!validateCPF(formData.cpf)) {
      toast.error("CPF inválido. Verifique os dígitos informados.");
      return false;
    }
  }

  // Validação de email se fornecido
  if (formData.email && formData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Formato de email inválido");
      return false;
    }
    
    if (formData.email.length > 320) {
      toast.error("Email muito longo");
      return false;
    }
  }

  // Validação de telefone se fornecido
  if (formData.phone && formData.phone.trim()) {
    const phoneClean = formData.phone.replace(/[^\d]/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      toast.error("Telefone deve ter 10 ou 11 dígitos");
      return false;
    }
  }

  return true;
}
