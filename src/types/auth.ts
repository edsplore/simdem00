export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: {
    [key: string]: boolean;
  };
}

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

export interface DecodedToken {
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  user_id: string;
  first_name: string;
  last_name: string;
  division: string;
  department: string;
  reporting_to: string;
  [key: string]: any; // For workspace keys like "Product Development-2025-1001"
}

export interface PermissionMap {
  [key: string]: string;
}