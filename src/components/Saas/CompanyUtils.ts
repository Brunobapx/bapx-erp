
import { Company } from "@/types/saas";

export const getCompanyPlanInfo = (company: Company) => {
  const sub = Array.isArray(company.company_subscriptions) ? company.company_subscriptions.find((s:any)=>s.status==="active") : null;
  const planName = sub?.saas_plans?.name || "-";
  return {
    vencimento: sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR") : "",
    plano: planName,
    isExpired: sub?.expires_at ? new Date(sub.expires_at) < new Date() : false,
  };
};
