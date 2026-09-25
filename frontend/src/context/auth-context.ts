import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
