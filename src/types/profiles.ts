
export interface AccessProfile {
  id: string;
  company_id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemModule {
  id: string;
  name: string;
  route_path: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProfileModule {
  id: string;
  profile_id: string;
  module_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  module?: SystemModule;
}

export interface ModulePermission {
  moduleId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
