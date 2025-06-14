
export interface CompanyPlan {
  name: string;
}

export interface CompanySubscription {
  status: string;
  expires_at: string | null;
  saas_plans: CompanyPlan | null;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  billing_email?: string;
  onboarded_at?: string;
  trial_expires_at?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_subscriptions: CompanySubscription[];
  whatsapp?: string;
}

export interface CreateCompanyData {
  name: string;
  subdomain:string;
  billing_email: string;
  plan_id: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name: string;
}
