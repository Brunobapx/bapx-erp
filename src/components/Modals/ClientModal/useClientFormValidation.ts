
import { toast } from "sonner";
import { sanitizeString, isValidCPF, isValidCNPJ } from "@/lib/validationUtils";

export function validateClientForm(formData: any) {
  const sanitizedName = sanitizeString(formData.name || "");
  if (!sanitizedName) {
    toast.error("Nome/Razão Social é obrigatório");
    return false;
  }

  if (formData.type === "Jurídica") {
    if (!formData.cnpj?.trim()) {
      toast.error("CNPJ é obrigatório para Pessoa Jurídica");
      return false;
    }
    if (!isValidCNPJ(formData.cnpj)) {
      toast.error("CNPJ inválido");
      return false;
    }
  }
  if (formData.type === "Física") {
    if (!formData.cpf?.trim()) {
      toast.error("CPF é obrigatório para Pessoa Física");
      return false;
    }
    if (!isValidCPF(formData.cpf)) {
      toast.error("CPF inválido");
      return false;
    }
  }

  return true;
}

