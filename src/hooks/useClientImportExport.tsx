import { useState } from 'react';
import { validateClientData, createClientTemplate } from '@/utils/importExport';
import { useClients } from '@/hooks/useClients';
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
    // Normalizar dados vindos do arquivo
    const normalizedClient = {
      name: clientData.nome || clientData.name,
      type: clientData.tipo || clientData.type,
      cpf: clientData.cpf,
      rg: clientData.rg,
      cnpj: clientData.cnpj,
      ie: clientData.ie,
      email: clientData.email,
      phone: clientData.telefone || clientData.phone,
      address: clientData.endereco || clientData.address,
      number: clientData.numero || clientData.number,
      complement: clientData.complemento || clientData.complement,
      bairro: clientData.bairro,
      city: clientData.cidade || clientData.city,
      state: clientData.estado || clientData.state,
      zip: clientData.cep || clientData.zip
    };

    return validateClientData(normalizedClient);
  };

  const importClients = async (clientsData: any[]): Promise<void> => {
    const errors: string[] = [];
    let successCount = 0;

    for (const [index, clientData] of clientsData.entries()) {
      try {
        // Normalizar tipo
        let normalizedType = clientData.tipo || clientData.type;
        if (normalizedType === 'Física' || normalizedType === 'PF') {
          normalizedType = 'Física';
        } else if (normalizedType === 'Jurídica' || normalizedType === 'PJ') {
          normalizedType = 'Jurídica';
        }

        const clientToCreate = {
          name: clientData.nome || clientData.name,
          type: normalizedType,
          cpf: clientData.cpf || undefined,
          rg: clientData.rg || undefined,
          cnpj: clientData.cnpj || undefined,
          ie: clientData.ie || undefined,
          email: clientData.email || undefined,
          phone: clientData.telefone || clientData.phone || undefined,
          address: clientData.endereco || clientData.address || undefined,
          number: clientData.numero || clientData.number || undefined,
          complement: clientData.complemento || clientData.complement || undefined,
          bairro: clientData.bairro || undefined,
          city: clientData.cidade || clientData.city || undefined,
          state: clientData.estado || clientData.state || undefined,
          zip: clientData.cep || clientData.zip || undefined
        };

        await createClient(clientToCreate);
        successCount++;
      } catch (error: any) {
        errors.push(`Linha ${index + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Erros na importação:', errors);
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
      tipo: client.type === 'Física' ? 'Física' : 'Jurídica',
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