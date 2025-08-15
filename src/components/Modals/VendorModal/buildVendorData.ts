
export function buildVendorData(formData: any, userId: string) {
  return {
    name: formData.name,
    cnpj: formData.cnpj || null,
    email: formData.email || null,
    phone: formData.phone || null,
    address: formData.address || null,
    city: formData.city || null,
    state: formData.state || null,
    zip: formData.zip || null,
    contact_person: formData.contact_person || null,
    notes: formData.notes || null,
    user_id: userId,
    // company_id será preenchido automaticamente pelo trigger set_company_id()
  };
}
