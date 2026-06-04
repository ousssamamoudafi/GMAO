import { createContext, useContext, useState, useCallback } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gmao_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem("gmao_token", data.access_token);
    localStorage.setItem("gmao_user", JSON.stringify(data.user));
    setUser(data.user);
    notify(`Bienvenue ${data.user.prenom} !`);
  };

  const logout = () => {
    localStorage.removeItem("gmao_token");
    localStorage.removeItem("gmao_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, notify, toast }}>
      {children}
    </AuthContext.Provider>
  );
}
