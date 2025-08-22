/**
 * Formata valores monetários para o padrão brasileiro
 */
export const formatCurrency = (value?: number | null): string => {
  if (!value && value !== 0) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata valores numéricos para o padrão brasileiro (sem símbolo de moeda)
 */
export const formatNumber = (value?: number | null): string => {
  if (!value && value !== 0) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata valores inteiros para o padrão brasileiro (sem casas decimais)
 */
export const formatInteger = (value?: number | null): string => {
  if (!value && value !== 0) return '0';
  
  return new Intl.NumberFormat('pt-BR').format(value);
};