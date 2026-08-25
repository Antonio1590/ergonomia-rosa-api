import { useState } from "react";
import type { ReactNode } from "react";
import type { AppUser } from "../services/SheetsService";
import { loginUser } from "../services/SheetsService";
import { AuthContext, SESSION_KEY } from "./useAuth";

function readStoredUser(): AppUser | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AppUser;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado inicial derivado directamente de localStorage (lazy init) en vez
  // de un useEffect que llame a setState al montar — evita una renderización
  // en cascada innecesaria.
  const [user, setUser] = useState<AppUser | null>(readStoredUser);

  const login = async (email: string, cedula: string) => {
    const loggedUser = await loginUser(email, cedula);
    setUser(loggedUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
