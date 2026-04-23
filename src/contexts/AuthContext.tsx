import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "admin" | "coordinator" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  matricula?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identificador: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  updateProfile: (data: Partial<Pick<User, "name">>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_API_URL;

// Converte o perfil do backend para o role do frontend
function mapPerfil(perfil: string): UserRole {
  if (perfil === "ADMINISTRADOR") return "admin";
  if (perfil === "COORDENADOR") return "coordinator";
  return "student";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa o estado a partir do localStorage (sessão persistida)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("senac_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("senac_token")
  );

  const login = useCallback(async (identificador: string, senha: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, senha }),
      });

      if (!response.ok) return false;

      // Resposta: { token, type, perfil, nome, email, expiresAt, senhaProvisoria }
      const data = await response.json();

      const jwt: string = data.token;
      const role = mapPerfil(data.perfil ?? "");

      const loggedUser: User = {
        id: data.id ? String(data.id) : "",
        name: data.nome ?? "",
        email: data.email ?? "",
        role,
        matricula: data.matricula,
      };

      setUser(loggedUser);
      setToken(jwt);
      localStorage.setItem("senac_token", jwt);
      localStorage.setItem("senac_user", JSON.stringify(loggedUser));

      return true;
    } catch (err) {
      console.error("Erro no login:", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("senac_token");
    localStorage.removeItem("senac_user");
  }, []);

  const hasPermission = useCallback(
    (allowedRoles: UserRole[]) => !!user && allowedRoles.includes(user.role),
    [user]
  );

  const updateProfile = useCallback((data: Partial<Pick<User, "name">>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("senac_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user, hasPermission, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
