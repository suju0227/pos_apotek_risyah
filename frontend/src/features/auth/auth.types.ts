export type RoleName = 'KASIR' | 'APOTEKER' | 'MANAGER';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: RoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
