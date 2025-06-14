
export function buildClientData(formData: any, userId: string) {
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
    number: formData.number || null,
    complement: formData.complement || null,
    city: formData.city || null,
    state: formData.state || null,
    zip: formData.zip || null,
    bairro: formData.bairro || null,
    user_id: userId
  };
}
