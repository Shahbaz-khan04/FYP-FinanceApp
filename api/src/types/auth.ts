export type AppUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SocialProvider = 'google';

export type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
