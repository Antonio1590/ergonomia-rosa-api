import { createContext, useContext } from "react";
import type { AppUser } from "../services/SheetsService";

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, cedula: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const SESSION_KEY = "rosa_session";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
