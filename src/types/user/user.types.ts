export type PublicUser = {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
  is_admin: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
};

export type CreateUserInput = {
  username: string;
  email: string | null;
  password: string;
  is_active: boolean;
  is_admin: boolean;
};

export type AuthenticateUserInput = {
  /** email ou username */
  identifier: string;
  password: string;
};

