/**
 * Interceptor global para fetch que automáticamente agrega autenticación
 * Este archivo debe ser importado en main.tsx para funcionar globalmente
 */

// Guardamos la función fetch original
const originalFetch = window.fetch;

// Función para obtener el token
function getToken(): string | null {
  return localStorage.getItem("token");
}

// Función para verificar si una URL necesita autenticación
function needsAuth(url: string): boolean {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Solo agregar auth a las peticiones a nuestra API
  return url.startsWith(API_BASE_URL) || url.startsWith("/api");
}

// Interceptor que sobrescribe fetch globalmente
window.fetch = function (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();

  // Si la URL necesita autenticación, agregar headers
  if (needsAuth(url)) {
    const token = getToken();

    if (token) {
      // Crear headers con autenticación
      const headers = new Headers(init?.headers);

      // Solo agregar Authorization si no existe ya
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Si no hay Content-Type y es un POST/PUT/PATCH, agregarlo
      if (
        !headers.has("Content-Type") &&
        init?.method &&
        ["POST", "PUT", "PATCH"].includes(init.method.toUpperCase())
      ) {
        headers.set("Content-Type", "application/json");
      }

      // Crear nueva configuración con headers actualizados
      const newInit: RequestInit = {
        ...init,
        headers,
      };

      console.log(`🔐 Fetch con auth: ${url}`);
      return originalFetch(input, newInit);
    }
  }

  // Para URLs que no necesitan auth, usar fetch original
  return originalFetch(input, init);
};

// Función para restaurar fetch original (útil para testing)
export function restoreOriginalFetch() {
  window.fetch = originalFetch;
}

export default function setupFetchInterceptor() {
  console.log(
    "🚀 Interceptor de fetch configurado - Todas las peticiones a la API tendrán autenticación automática"
  );
}
