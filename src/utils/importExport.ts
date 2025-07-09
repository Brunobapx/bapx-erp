import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export interface ImportResult {
  success: number;
  errors: string[];
  total: number;
  validData: any[];
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  filename: string;
  data: any[];
  headers: string[];
  title?: string;
}

// Função para validar CPF
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return true; // CPF pode ser opcional
  
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return parseInt(cleanCPF.charAt(9)) === digit1 && parseInt(cleanCPF.charAt(10)) === digit2;
};

// Função para validar CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return true; // CNPJ pode ser opcional
  
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Calcula o primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  // Calcula o segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return parseInt(cleanCNPJ.charAt(12)) === digit1 && parseInt(cleanCNPJ.charAt(13)) === digit2;
};

// Função para validar dados de cliente
export const validateClientData = (client: any): string[] => {
  const errors: string[] = [];
  
  // Nome é obrigatório
  if (!client.name || client.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }
  
  // Tipo é obrigatório
  if (!client.type || !['PF', 'PJ', 'Física', 'Jurídica'].includes(client.type)) {
    errors.push('Tipo deve ser PF (Pessoa Física) ou PJ (Pessoa Jurídica)');
  }
  
  // Validação específica por tipo
  const normalizedType = client.type === 'Física' || client.type === 'PF' ? 'PF' : 'PJ';
  
  if (normalizedType === 'PF') {
    if (client.cpf && !validateCPF(client.cpf)) {
      errors.push('CPF inválido');
    }
  } else {
    if (client.cnpj && !validateCNPJ(client.cnpj)) {
      errors.push('CNPJ inválido');
    }
  }
  
  // Validação de email
  if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    errors.push('Email inválido');
  }
  
  return errors;
};

// Função para processar arquivo Excel/CSV
export const processImportFile = async (file: File, validator: (data: any) => string[]): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Arquivo vazio'));
          return;
        }
        
        // Primeira linha são os cabeçalhos
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const result: ImportResult = {
          success: 0,
          errors: [],
          total: rows.length,
          validData: []
        };
        
        rows.forEach((row, index) => {
          const rowData: any = {};
          headers.forEach((header, colIndex) => {
            if (row[colIndex] !== undefined && row[colIndex] !== null) {
              rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[colIndex];
            }
          });
          
          // Pular linhas vazias
          if (Object.keys(rowData).length === 0) {
            return;
          }
          
          const validationErrors = validator(rowData);
          
          if (validationErrors.length > 0) {
            result.errors.push(`Linha ${index + 2}: ${validationErrors.join(', ')}`);
          } else {
            result.validData.push(rowData);
            result.success++;
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Função para exportar dados
export const exportData = (options: ExportOptions): void => {
  const { format, filename, data, headers, title } = options;
  
  if (format === 'xlsx') {
    exportToExcel(data, headers, filename, title);
  } else if (format === 'csv') {
    exportToCSV(data, headers, filename);
  } else if (format === 'pdf') {
    // Implementar PDF export se necessário
    toast.info('Exportação em PDF será implementada em breve');
  }
};

// Função para exportar para Excel
const exportToExcel = (data: any[], headers: string[], filename: string, title?: string): void => {
  const workbook = XLSX.utils.book_new();
  
  // Criar dados para a planilha
  const worksheetData = [headers, ...data.map(item => 
    headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[\/]/g, '_');
      return item[key] || '';
    })
  )];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Adicionar título se fornecido
  if (title) {
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A3' });
    // Ajustar dados
    const dataRows = data.map(item => 
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[\/]/g, '_');
        return item[key] || '';
      })
    );
    XLSX.utils.sheet_add_aoa(worksheet, dataRows, { origin: 'A4' });
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
  
  toast.success('Arquivo Excel exportado com sucesso!');
};

// Função para exportar para CSV
const exportToCSV = (data: any[], headers: string[], filename: string): void => {
  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[\/]/g, '_');
        const value = item[key] || '';
        // Escapar vírgulas e aspas
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  toast.success('Arquivo CSV exportado com sucesso!');
};

// Função para criar template de clientes
export const createClientTemplate = (): void => {
  const headers = [
    'Nome', 'Tipo', 'CPF', 'RG', 'CNPJ', 'IE', 
    'Email', 'Telefone', 'Endereço', 'Número', 
    'Complemento', 'Bairro', 'Cidade', 'Estado', 'CEP'
  ];
  
  const exampleData = [
    {
      nome: 'João da Silva',
      tipo: 'PF',
      cpf: '123.456.789-10',
      rg: '12.345.678-9',
      cnpj: '',
      ie: '',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123',
      numero: '123',
      complemento: 'Apto 45',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    {
      nome: 'Empresa XYZ Ltda',
      tipo: 'PJ',
      cpf: '',
      rg: '',
      cnpj: '12.345.678/0001-90',
      ie: '123.456.789.123',
      email: 'contato@empresa.com',
      telefone: '(11) 3333-4444',
      endereco: 'Av. Paulista, 1000',
      numero: '1000',
      complemento: 'Sala 15',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100'
    }
  ];
  
  exportToExcel(exampleData, headers, 'template_clientes', 'Template para Importação de Clientes');
};