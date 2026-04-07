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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  updateProfile: (data: Partial<Pick<User, "name">>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUsers: Record<string, User> = {
  "admin@senac.br": { id: "1", name: "Carlos Admin", email: "admin@senac.br", role: "admin" },
  "coord@senac.br": { id: "2", name: "Maria Coordenadora", email: "coord@senac.br", role: "coordinator" },
  "aluno@senac.br": { id: "3", name: "João Pedro", email: "joao@senac.br", role: "student", matricula: "2024001" },
};

// Simulates JWT token generation
function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }));
  return `${header}.${payload}.mock-signature`;
}

function parseToken(token: string): { sub: string; email: string; role: UserRole; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("senac_token");
    if (!token) return null;
    const payload = parseToken(token);
    if (!payload) { localStorage.removeItem("senac_token"); localStorage.removeItem("senac_user"); return null; }
    const saved = localStorage.getItem("senac_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("senac_token"));

  const login = useCallback(async (email: string, _password: string) => {
    const found = mockUsers[email.toLowerCase()];
    if (found) {
      const jwt = generateMockToken(found);
      setUser(found);
      setToken(jwt);
      localStorage.setItem("senac_user", JSON.stringify(found));
      localStorage.setItem("senac_token", jwt);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("senac_user");
    localStorage.removeItem("senac_token");
  }, []);

  const hasPermission = useCallback((allowedRoles: UserRole[]) => {
    return !!user && allowedRoles.includes(user.role);
  }, [user]);

  const updateProfile = useCallback((data: Partial<Pick<User, "name">>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("senac_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, hasPermission, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
