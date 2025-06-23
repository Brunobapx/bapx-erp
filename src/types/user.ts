
export interface SimpleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string;
  department: string;
  position: string;
  profile_id?: string;
  company_id?: string;
  access_profile?: {
    name: string;
    description: string;
  } | null;
}
