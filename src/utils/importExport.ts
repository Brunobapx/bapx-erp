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
            if (row[colIndex] !== undefined && row[colIndex] !== null && String(row[colIndex]).trim() !== '') {
              // Mapear cabeçalhos do Excel para os campos corretos
              const normalizedHeader = header.toLowerCase().trim();
              let fieldName = normalizedHeader;
              
              // Mapeamento específico para os campos de cliente
              switch (normalizedHeader) {
                case 'nome':
                  fieldName = 'nome';
                  break;
                case 'tipo':
                  fieldName = 'tipo';
                  break;
                case 'cpf':
                  fieldName = 'cpf';
                  break;
                case 'rg':
                  fieldName = 'rg';
                  break;
                case 'cnpj':
                  fieldName = 'cnpj';
                  break;
                case 'ie':
                  fieldName = 'ie';
                  break;
                case 'email':
                  fieldName = 'email';
                  break;
                case 'telefone':
                  fieldName = 'telefone';
                  break;
                case 'endereço':
                case 'endereco':
                  fieldName = 'endereco';
                  break;
                case 'número':
                case 'numero':
                  fieldName = 'numero';
                  break;
                case 'complemento':
                  fieldName = 'complemento';
                  break;
                case 'bairro':
                  fieldName = 'bairro';
                  break;
                case 'cidade':
                  fieldName = 'cidade';
                  break;
                case 'estado':
                  fieldName = 'estado';
                  break;
                case 'cep':
                  fieldName = 'cep';
                  break;
                default:
                  fieldName = normalizedHeader.replace(/\s+/g, '_');
              }
              
              rowData[fieldName] = String(row[colIndex]).trim();
            }
          });
          
          // Pular linhas vazias (que não tenham pelo menos nome e tipo)
          if (!rowData.nome || !rowData.tipo) {
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

// Função para criar template de exemplo
export const createTemplate = (data: any[], filename: string) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  // Fazer download do template
  XLSX.writeFile(workbook, filename);
};

// Função para importar arquivo
export const importFromFile = async <T = any>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar a primeira aba
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const result = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
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

// Função para criar template de clientes
export const createClientTemplate = (): void => {
  const headers = [
    'Nome', 'Tipo', 'CPF', 'RG', 'CNPJ', 'IE', 
    'Email', 'Telefone', 'Endereço', 'Número', 
    'Complemento', 'Bairro', 'Cidade', 'Estado', 'CEP'
  ];
  
  // Criar apenas com cabeçalhos vazios
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, 'template_clientes.xlsx');
  
  toast.success('Template de clientes baixado com sucesso!');
};