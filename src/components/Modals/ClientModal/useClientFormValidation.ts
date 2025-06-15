
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Função para sanitizar entrada e prevenir XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Função para validar CPF usando a função do banco
async function validateCPF(cpf: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('validate_cpf', { cpf });
    if (error) {
      console.error('Erro ao validar CPF:', error);
      return false;
    }
    return data || false;
  } catch (error) {
    console.error('Erro ao validar CPF:', error);
    return false;
  }
}

// Função para validar CNPJ usando a função do banco
async function validateCNPJ(cnpj: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('validate_cnpj', { cnpj });
    if (error) {
      console.error('Erro ao validar CNPJ:', error);
      return false;
    }
    return data || false;
  } catch (error) {
    console.error('Erro ao validar CNPJ:', error);
    return false;
  }
}

export async function validateClientForm(formData: any) {
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
    
    const isValidCNPJ = await validateCNPJ(formData.cnpj);
    if (!isValidCNPJ) {
      toast.error("CNPJ inválido. Verifique os dígitos informados.");
      return false;
    }
  }

  if (formData.type === 'Física') {
    if (!formData.cpf.trim()) {
      toast.error("CPF é obrigatório para Pessoa Física");
      return false;
    }
    
    const isValidCPF = await validateCPF(formData.cpf);
    if (!isValidCPF) {
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
