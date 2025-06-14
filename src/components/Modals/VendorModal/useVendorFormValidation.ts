
import { toast } from "sonner";

export function validateVendorForm(formData: any) {
  if (!formData.name.trim()) {
    toast.error("Razão Social é obrigatória");
    return false;
  }
  // Exemplo: obrigatoriedade extra para campos importantes pode ser adicionada conforme necessário
  return true;
}
