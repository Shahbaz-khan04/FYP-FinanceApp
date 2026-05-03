export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
