import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface ConnectionStatus {
  backend: boolean;
  flujoCajaEndpoint: boolean;
  error?: string;
}

export function ConnectionDebugger() {
  const [status, setStatus] = useState<ConnectionStatus>({
    backend: false,
    flujoCajaEndpoint: false,
  });
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    const newStatus: ConnectionStatus = {
      backend: false,
      flujoCajaEndpoint: false,
    };

    try {
      // Probar conexión básica al backend
      const backendResponse = await fetch("http://localhost:4000/", {
        method: "GET",
      });
      newStatus.backend = backendResponse.ok;
    } catch (error) {
      newStatus.error = "No se puede conectar al backend en puerto 4000";
    }

    try {
      // Probar endpoint específico de flujo de caja con datos de prueba
      const testPayload = {
        machineId: 1,
        porcentajeResidual: 0.1,
        margenInterno: 0.05,
        gastosGeneralesMantenimiento: 0.05,
        horasOperativasMes: 300,
        tasaDescuentoEmpresa: 0.08,
        comentario: "Test de conexión",
        usuarioId: "test-user",
      };

      const flujoCajaResponse = await fetch(
        "http://localhost:4000/calculos/flujo-caja/preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testPayload),
        }
      );

      if (flujoCajaResponse.ok) {
        newStatus.flujoCajaEndpoint = true;
      } else {
        const errorData = await flujoCajaResponse.text();
        newStatus.error = `Error en flujo-caja: ${flujoCajaResponse.status} - ${errorData}`;
      }
    } catch (error: any) {
      if (!newStatus.error) {
        newStatus.error = `Error en endpoint flujo-caja: ${error.message}`;
      }
    }

    setStatus(newStatus);
    setChecking(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Diagnóstico de Conexión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Conexión al Backend:</span>
          {status.backend ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <span>Endpoint Flujo de Caja:</span>
          {status.flujoCajaEndpoint ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        {status.error && (
          <Alert variant="destructive">
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={checking}
        >
          {checking ? "Verificando..." : "Verificar Conexión"}
        </Button>

        {!status.backend && (
          <Alert>
            <AlertDescription>
              <strong>Posibles soluciones:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  Verifica que el backend esté corriendo: <br />
                  <code className="bg-gray-100 px-1 rounded">
                    cd apps/backend && npm run start:dev
                  </code>
                </li>
                <li>El backend debe estar ejecutándose en el puerto 4000</li>
                <li>Revisa la consola del backend para errores</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
