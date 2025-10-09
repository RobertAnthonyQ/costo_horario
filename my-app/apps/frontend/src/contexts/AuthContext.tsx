import React, { createContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/authService";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar token y usuario del localStorage al iniciar
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedToken) {
          setToken(storedToken);
          authService.setToken(storedToken);

          try {
            // Verificar que el token sea válido
            const userData = await authService.getCurrentUser();
            setUser(userData);
            console.log("Usuario autenticado:", userData);
          } catch (error) {
            console.error("Token inválido, intentando refrescar...", error);

            // Si falla, intentar refrescar el token
            if (storedRefreshToken) {
              try {
                const response =
                  await authService.refreshToken(storedRefreshToken);

                if (!response.success || !response.session) {
                  throw new Error(response.error || "Error al refrescar token");
                }

                const { access_token, refresh_token } = response.session;

                localStorage.setItem("token", access_token);
                if (refresh_token) {
                  localStorage.setItem("refreshToken", refresh_token);
                }

                authService.setToken(access_token);
                setToken(access_token);

                // Obtener usuario actualizado
                const userData = await authService.getCurrentUser();
                setUser(userData);
                console.log("Token refrescado y usuario cargado:", userData);
              } catch (refreshError) {
                console.error("Error al refrescar token:", refreshError);
                // Limpiar todo si falla el refresh
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                authService.setToken(null);
                setToken(null);
                setUser(null);
              }
            } else {
              console.log("No hay refresh token disponible, limpiando sesión");
              localStorage.removeItem("token");
              authService.setToken(null);
              setToken(null);
              setUser(null);
            }
          }
        } else {
          console.log("No hay token almacenado");
        }
      } catch (error) {
        console.error("Error en inicialización de auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      console.log("📋 Respuesta completa del servidor:", response);

      if (!response.success || !response.session || !response.user) {
        throw new Error(response.error || "Error en login");
      }

      const { access_token, refresh_token } = response.session;
      const userData = response.user;

      console.log("🔑 Access token recibido: [TOKEN]");

      // Guardar en localStorage
      localStorage.setItem("token", access_token);
      if (refresh_token) {
        localStorage.setItem("refreshToken", refresh_token);
      }

      // Configurar token en el servicio
      authService.setToken(access_token);

      // Actualizar estado
      console.log("🔧 Actualizando estados con:", {
        access_token: access_token ? "Token presente" : "Sin token",
        userData: userData?.email || "Sin usuario",
      });

      setToken(access_token);
      setUser(userData);

      console.log("Login exitoso para usuario:", userData);
      console.log(
        "Estados actualizados - Token:",
        !!access_token,
        "User:",
        !!userData
      );
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    try {
      await authService.register({
        email,
        password,
        full_name: fullName,
      });
      // No guardamos la sesión automáticamente después del registro
      // El usuario debe hacer login manualmente
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error al hacer logout:", error);
    } finally {
      // Limpiar siempre, aunque falle la petición
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      authService.setToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const refreshToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await authService.refreshToken(storedRefreshToken);

      if (!response.success || !response.session) {
        throw new Error(response.error || "Error al refrescar token");
      }

      const { access_token, refresh_token } = response.session;

      localStorage.setItem("token", access_token);
      if (refresh_token) {
        localStorage.setItem("refreshToken", refresh_token);
      }

      authService.setToken(access_token);
      setToken(access_token);

      // Obtener usuario actualizado
      const userData = await authService.getCurrentUser();
      setUser(userData);

      console.log("Token refrescado exitosamente para usuario:", userData);
    } catch (error) {
      console.error("Error al refrescar token:", error);
      throw error;
    }
  };

  // Calcular isAuthenticated de manera más robusta
  const isAuthenticated = !!user && !!token;

  // Logging para debug
  console.log("AuthContext - Estado actual:", {
    user: user?.email || null,
    token: token ? "Token presente" : "Sin token",
    isAuthenticated,
    isLoading,
  });

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
