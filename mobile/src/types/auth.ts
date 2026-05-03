export type UserSettings = {
  notificationsEnabled: boolean;
  theme: 'dark' | 'light';
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
