import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute - Estado:", {
    isAuthenticated,
    isLoading,
    user,
    path: location.pathname,
  });

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    console.log("ProtectedRoute - Mostrando loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log(
      "ProtectedRoute - Usuario no autenticado, redirigiendo al login"
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, mostrar el contenido protegido
  console.log("ProtectedRoute - Usuario autenticado, mostrando contenido");
  return <>{children}</>;
};
