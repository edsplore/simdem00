export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// export type UserRole = 'super_admin' | 'org_admin' | 'trainer' | 'trainee' | 'creator';

export type UserRole = 'workspace_admin' | 'manager' | 'org_admin' | 'trainee' | 'creator';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}