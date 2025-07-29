import { useState } from 'react';
import { validateClientData, createClientTemplate } from '@/utils/importExport';
import { useClients } from '@/hooks/useClients.ts';
import { toast } from 'sonner';

export const useClientImportExport = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { allClients, createClient, refreshClients } = useClients();

  const clientHeaders = [
    'Nome',
    'Tipo',
    'CPF',
    'RG', 
    'CNPJ',
    'IE',
    'Email',
    'Telefone',
    'Endereço',
    'Número',
    'Complemento',
    'Bairro',
    'Cidade',
    'Estado',
    'CEP'
  ];

  const validateClient = (clientData: any): string[] => {
    // Normalizar dados vindos do arquivo (agora os dados já vêm com os nomes corretos)
    const normalizedClient = {
      name: clientData.nome,
      type: clientData.tipo,
      cpf: clientData.cpf,
      rg: clientData.rg,
      cnpj: clientData.cnpj,
      ie: clientData.ie,
      email: clientData.email,
      phone: clientData.telefone,
      address: clientData.endereco,
      number: clientData.numero,
      complement: clientData.complemento,
      bairro: clientData.bairro,
      city: clientData.cidade,
      state: clientData.estado,
      zip: clientData.cep
    };

    return validateClientData(normalizedClient);
  };

  const importClients = async (clientsData: any[]): Promise<void> => {
    const errors: string[] = [];
    let successCount = 0;

    console.log('Iniciando importação de clientes:', clientsData);

    for (const [index, clientData] of clientsData.entries()) {
      try {
        console.log(`Processando cliente ${index + 1}:`, clientData);
        // Normalizar tipo automaticamente baseado no texto
        let normalizedType: 'PF' | 'PJ' = 'PF'; // padrão
        const tipoTexto = (clientData.tipo || '').toLowerCase().trim();
        
        // Regras para determinar o tipo automaticamente
        if (tipoTexto.includes('juridica') || 
            tipoTexto.includes('jurídica') || 
            tipoTexto === 'pj' || 
            tipoTexto === 'j' ||
            tipoTexto.includes('empresa') ||
            tipoTexto.includes('cnpj')) {
          normalizedType = 'PJ';
        } else if (tipoTexto.includes('fisica') || 
                   tipoTexto.includes('física') || 
                   tipoTexto === 'pf' || 
                   tipoTexto === 'f' ||
                   tipoTexto.includes('pessoa') ||
                   tipoTexto.includes('cpf')) {
          normalizedType = 'PF';
        }
        // Se tiver CNPJ preenchido, automaticamente é PJ
        else if (clientData.cnpj && clientData.cnpj.trim()) {
          normalizedType = 'PJ';
        }
        // Se tiver CPF preenchido, automaticamente é PF
        else if (clientData.cpf && clientData.cpf.trim()) {
          normalizedType = 'PF';
        }

        const clientToCreate = {
          name: clientData.nome,
          type: normalizedType,
          cpf: clientData.cpf || undefined,
          rg: clientData.rg || undefined,
          cnpj: clientData.cnpj || undefined,
          ie: clientData.ie || undefined,
          email: clientData.email || undefined,
          phone: clientData.telefone || undefined,
          address: clientData.endereco || undefined,
          number: clientData.numero || undefined,
          complement: clientData.complemento || undefined,
          bairro: clientData.bairro || undefined,
          city: clientData.cidade || undefined,
          state: clientData.estado || undefined,
          zip: clientData.cep || undefined
        };

        console.log(`Cliente normalizado para criação:`, clientToCreate);
        
        await createClient(clientToCreate);
        console.log(`Cliente ${index + 1} criado com sucesso`);
        successCount++;
      } catch (error: any) {
        errors.push(`Linha ${index + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Erros na importação:', errors);
      toast.error(`Importação concluída com ${errors.length} erros. Verifique o console para detalhes.`);
    }

    if (successCount > 0) {
      toast.success(`${successCount} clientes importados com sucesso!`);
    }

    // Atualizar lista
    await refreshClients();
  };

  const exportClients = () => {
    setIsExportModalOpen(true);
  };

  const downloadTemplate = () => {
    createClientTemplate();
  };

  const getExportData = () => {
    return allClients.map(client => ({
      nome: client.name,
      tipo: client.type === 'PF' ? 'Física' : 'Jurídica',
      cpf: client.cpf || '',
      rg: client.rg || '',
      cnpj: client.cnpj || '',
      ie: client.ie || '',
      email: client.email || '',
      telefone: client.phone || '',
      endereco: client.address || '',
      numero: client.number || '',
      complemento: client.complement || '',
      bairro: client.bairro || '',
      cidade: client.city || '',
      estado: client.state || '',
      cep: client.zip || ''
    }));
  };

  return {
    // Modal states
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    
    // Data
    clientHeaders,
    exportData: getExportData(),
    
    // Functions
    validateClient,
    importClients,
    exportClients,
    downloadTemplate
  };
};