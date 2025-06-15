
import { toast } from "sonner";

export function validateClientForm(formData: any) {
  if (!formData.name.trim()) {
    toast.error("Nome/Razão Social é obrigatório");
    return false;
  }

  if (formData.type === 'Jurídica' && !formData.cnpj.trim()) {
    toast.error("CNPJ é obrigatório para Pessoa Jurídica");
    return false;
  }

  if (formData.type === 'Física' && !formData.cpf.trim()) {
    toast.error("CPF é obrigatório para Pessoa Física");
    return false;
  }

  return true;
}
