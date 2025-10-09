/**
 * Utilidades para manejo de autenticación en servicios
 */

// Función para obtener headers con autenticación
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Función para hacer fetch con autenticación automática
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();

  // Combinar headers existentes con los de autenticación
  const headers = {
    ...authHeaders,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Función para manejar errores de API de manera consistente
export function handleApiError(error: any, context: string): void {
  if (error?.status === 401) {
    console.error(`🔐 ${context}: Token inválido o expirado`);
    // El authService interceptor se encargará de la redirección
  } else {
    console.error(`❌ ${context}:`, error);
  }
}
