
export function buildClientData(formData: any, userId: string, companyId: string) {
  return {
    name: formData.name,
    type: formData.type as 'Física' | 'Jurídica',
    cnpj: formData.type === 'Jurídica' ? formData.cnpj : null,
    ie: formData.type === 'Jurídica' ? formData.ie : null,
    cpf: formData.type === 'Física' ? formData.cpf : null,
    rg: formData.type === 'Física' ? formData.rg : null,
    email: formData.email || null,
    phone: formData.phone || null,
    address: formData.address || null,
    city: formData.city || null,
    state: formData.state || null,
    zip: formData.zip || null,
    // bairro removido temporariamente até o banco estar atualizado!
    user_id: userId,
    company_id: companyId,
    // NÃO incluir número e complemento e outros campos visuais!
  };
}
