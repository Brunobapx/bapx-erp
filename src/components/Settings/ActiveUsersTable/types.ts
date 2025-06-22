
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
  is_active: boolean;
  last_login: string;
  role: string;
  email?: string;
  profile_id?: string;
  access_profile?: {
    name: string;
    description: string;
  } | null;
}

export interface AccessProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ActiveUsersTableProps {
  users: UserProfile[];
  availableProfiles: AccessProfile[];
  userRole: string;
  currentUserId?: string;
  onStatusChange: (userId: string, isActive: boolean) => void;
  onProfileChange: (userId: string, profileId: string) => void;
  onDeleteUser: (userId: string, userName: string, userEmail: string) => void;
  loading?: boolean;
}
