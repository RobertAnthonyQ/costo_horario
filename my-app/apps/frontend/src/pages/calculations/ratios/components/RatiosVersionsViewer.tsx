import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Download,
  Search,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { ratiosService } from "../services/ratiosService";
import { RatioType } from "../models/types";

interface RatiosVersionsViewerProps {
  ratioTypes: RatioType[];
}

interface VersionRecord {
  id: number;
  fecha_efectiva: string;
  lugar_operacion?: string;
  ratios_version: {
    fecha_efectiva: string;
    ratios: Array<{
      tipo_ratio_id: number;
      tipo_ratio_nombre: string;
      valor: number | null;
      categoria: string;
    }>;
    comentario?: string;
    usuario_id?: string;
  };
  modelo: {
    id: number;
    nombre: string;
    marca?: { nombre: string };
    equipo?: { nombre: string };
    flota?: { nombre: string };
  };
  tipo_ratio?: {
    id: number;
    nombre: string;
    categoria: string;
  };
}

export default function RatiosVersionsViewer({
  ratioTypes,
}: RatiosVersionsViewerProps) {
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  // Filtros
  const [lugarFilter, setLugarFilter] = useState("");
  const [selectedTipoRatio, setSelectedTipoRatio] = useState<string>("");

  const loadAllVersions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ratiosService.getAllVersionesJson(
        lugarFilter || undefined
      );

      if (response.success && response.data) {
        setVersions(response.data);
      } else {
        setError(response.error || "Error al cargar las versiones");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const loadVersionsByTipoRatio = async (tipoRatioId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ratiosService.getVersionesByTipoRatio(tipoRatioId);

      if (response.success && response.data) {
        setVersions(response.data);
      } else {
        setError(response.error || "Error al cargar las versiones por tipo");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (selectedTipoRatio) {
      loadVersionsByTipoRatio(Number(selectedTipoRatio));
    } else {
      loadAllVersions();
    }
  };

  const toggleExpanded = (versionId: number) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const exportToJson = (version: VersionRecord) => {
    const dataStr = JSON.stringify(version.ratios_version, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const ts = version.ratios_version?.fecha_efectiva || version.fecha_efectiva;
    link.download = `ratios-version-${version.id}-${new Date(ts).toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Devuelve fecha/hora local Lima priorizando la interna ratios_version.fecha_efectiva
  const formatDate = (version: VersionRecord) => {
    const dateStr =
      version.ratios_version?.fecha_efectiva || version.fecha_efectiva;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Lima",
    });
  };

  useEffect(() => {
    loadAllVersions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visor de Versiones JSON de Ratios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="lugar-filter">Filtrar por lugar</Label>
            <Input
              id="lugar-filter"
              placeholder="Ej: Mina Norte"
              value={lugarFilter}
              onChange={(e) => setLugarFilter(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tipo-ratio-filter">Filtrar por tipo de ratio</Label>
            <Select
              value={selectedTipoRatio}
              onValueChange={setSelectedTipoRatio}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                {ratioTypes.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nombre} - {tipo.categoria || "Sin categoría"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={loadAllVersions}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Estado de carga y errores */}
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Cargando versiones...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={loadAllVersions}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Lista de versiones */}
        {!loading && !error && (
          <div className="space-y-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  No se encontraron versiones JSON con los filtros aplicados
                </p>
                <p className="text-sm">
                  Las versiones JSON se crean cuando se guarda explícitamente el
                  campo ratios_version
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Encontradas {versions.length} versiones JSON
                </div>

                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">ID: {version.id}</Badge>
                            <Badge>
                              {version.modelo.marca?.nombre}{" "}
                              {version.modelo.nombre}
                            </Badge>
                            {version.tipo_ratio && (
                              <Badge variant="secondary">
                                {version.tipo_ratio.nombre}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(version)}</span>
                            </div>

                            {version.lugar_operacion && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{version.lugar_operacion}</span>
                              </div>
                            )}

                            {version.ratios_version.usuario_id && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{version.ratios_version.usuario_id}</span>
                              </div>
                            )}

                            {version.ratios_version.comentario && (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">
                                  {version.ratios_version.comentario}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(version.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {expandedVersion === version.id ? "Ocultar" : "Ver"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToJson(version)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            JSON
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Detalles expandidos */}
                    {expandedVersion === version.id && (
                      <div className="border-t bg-muted/30 p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Ratios incluidos:
                            </h4>
                            <div className="grid gap-2">
                              {version.ratios_version.ratios.map(
                                (ratio, idx) => (
                                  <div
                                    key={`${ratio.tipo_ratio_id}-${idx}`}
                                    className="flex items-center justify-between p-2 bg-card rounded border"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {ratio.tipo_ratio_nombre}
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {ratio.categoria}
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono">
                                        {ratio.valor !== null
                                          ? ratio.valor.toFixed(4)
                                          : "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">JSON Completo:</h4>
                            <pre className="bg-card p-3 rounded border text-xs overflow-auto max-h-64">
                              {JSON.stringify(version.ratios_version, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
