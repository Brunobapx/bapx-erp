
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileId: string;
  role: string;
  department?: string;
  position?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  role?: string;
  profile_id?: string;
  new_password?: string;
}

export interface OperationResult {
  success: boolean;
  error?: string;
  data?: any;
}
