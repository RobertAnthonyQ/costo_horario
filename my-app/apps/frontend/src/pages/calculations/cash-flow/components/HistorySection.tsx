import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, FileText, FileSpreadsheet } from "lucide-react";
import { FlujoCajaVersion } from "../models/types";

interface HistorySectionProps {
  versions: FlujoCajaVersion[];
  versionsLoading: boolean;
  onViewDetails: (version: FlujoCajaVersion) => void;
  onViewAmortizacion?: (version: FlujoCajaVersion) => void;
}

export function HistorySection({
  versions,
  versionsLoading,
  onViewDetails,
  onViewAmortizacion,
}: HistorySectionProps) {
  if (versionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Cargando historial...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay análisis previos para esta máquina
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historial de Análisis ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{version.nombre}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(version.fechaCalculo).toLocaleDateString("es-PE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                {onViewAmortizacion && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAmortizacion(version)}
                    title="Ver tabla de amortización"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(version)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
