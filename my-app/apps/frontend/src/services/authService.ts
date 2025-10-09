import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
  error?: string;
}

class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 60000, // 60 segundos de timeout para Render
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para agregar el token a todas las peticiones
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores 401 (token expirado)
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Si es 401 y no es la ruta de login/refresh, redirigir al login
        if (error.response?.status === 401) {
          const originalRequest = error.config;
          const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

          // Si no es un endpoint de auth, el token expiró
          if (!isAuthEndpoint) {
            console.error("Token expirado, redirigiendo al login...");

            // Limpiar localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            this.token = null;

            // Redirigir al login
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>(
      "/auth/register",
      credentials
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post("/auth/logout");
  }

  async getCurrentUser() {
    const response = await this.api.get("/auth/me");
    return response.data.user;
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await this.api.post<RefreshResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  // Método para verificar si el backend está disponible (útil para Render)
  async checkBackendHealth(): Promise<boolean> {
    try {
      await this.api.get("/health", { timeout: 10000 });
      return true;
    } catch (error) {
      console.error("Backend no disponible:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
