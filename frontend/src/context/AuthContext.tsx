import { useState } from "react";
import { type ReactNode } from "react";
import { api } from "../api/client";
import { AuthContext } from "./auth-context";
import { type AuthUser } from "./auth-context";

const readStoredSession = () => {
  if (typeof window === "undefined") return { token: null, user: null };

  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!storedToken || !storedUser) return { token: null, user: null };

  try {
    return {
      token: storedToken,
      user: JSON.parse(storedUser) as AuthUser,
    };
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialSession = readStoredSession();
  const [user, setUser] = useState<AuthUser | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { token: t, user: u } = data.data;
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const register = async (
    email: string,
    username: string,
    password: string,
  ) => {
    const { data } = await api.post("/auth/register", {
      email,
      username,
      password,
    });
    const { token: t, user: u } = data.data;
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
