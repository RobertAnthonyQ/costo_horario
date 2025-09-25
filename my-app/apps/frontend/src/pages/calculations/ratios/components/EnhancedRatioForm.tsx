import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Save,
  MapPin,
  Calendar,
  User,
  Package,
  AlertCircle,
} from "lucide-react";
import { ratiosService } from "../services/ratiosService";
import { RatioType } from "../models/types";

interface EnhancedRatioFormProps {
  selectedMachine: string;
  currentModeloId: number | null;
  ratioTypes: RatioType[];
  onRatioCreated: () => void; // Callback para refrescar los datos
}

export default function EnhancedRatioForm({
  selectedMachine,
  currentModeloId,
  ratioTypes,
  onRatioCreated,
}: EnhancedRatioFormProps) {
  const [formData, setFormData] = useState({
    tipo_ratio_id: "",
    valor: "",
    lugar_operacion: "",
    comentario: "",
    usuario_id: "",
    crear_version_completa: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      tipo_ratio_id: "",
      valor: "",
      lugar_operacion: "",
      comentario: "",
      usuario_id: "",
      crear_version_completa: false,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentModeloId) {
      setError("Debe seleccionar una máquina válida");
      return;
    }

    if (!formData.tipo_ratio_id) {
      setError("Debe seleccionar un tipo de ratio");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const createDto = {
        modelo_id: currentModeloId,
        tipo_ratio_id: Number(formData.tipo_ratio_id),
        valor: formData.valor === "" ? undefined : Number(formData.valor),
        fecha_efectiva: new Date().toISOString(),
        lugar_operacion: formData.lugar_operacion || undefined,
      };

      let response;

      if (formData.crear_version_completa) {
        // Crear versión completa automáticamente
        response = await ratiosService.createCompleteVersion(currentModeloId, {
          comentario: formData.comentario || "Versión completa automática",
          usuario_id: formData.usuario_id || undefined,
          lugar_operacion: formData.lugar_operacion || undefined,
        });
      } else {
        // Crear ratio individual
        response = await ratiosService.create({
          ...createDto,
          comentario: formData.comentario || undefined,
        });
      }

      if (response.success) {
        setSuccess(
          formData.crear_version_completa
            ? "Versión completa de ratios creada exitosamente"
            : "Ratio individual creado exitosamente"
        );
        resetForm();
        onRatioCreated(); // Notificar al componente padre para refrescar
      } else {
        setError(response.error || "Error al crear el ratio");
      }
    } catch (err) {
      setError("Error de conexión. Verifique su red.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRatioType = ratioTypes.find(
    (t) => t.id === Number(formData.tipo_ratio_id)
  );

  if (!selectedMachine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Nuevo Ratio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona una máquina para crear ratios</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Agregar Nuevo Ratio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Ratio */}
          <div>
            <Label htmlFor="tipo_ratio_id">Tipo de Ratio *</Label>
            <Select
              value={formData.tipo_ratio_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, tipo_ratio_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de ratio" />
              </SelectTrigger>
              <SelectContent>
                {ratioTypes.map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    <div className="flex items-center gap-2">
                      <span>{tipo.nombre}</span>
                      {tipo.categoria && (
                        <Badge variant="outline" className="text-xs">
                          {tipo.categoria}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRatioType && (
              <div className="text-xs text-muted-foreground mt-1">
                Categoría: {selectedRatioType.categoria || "Sin categoría"}
              </div>
            )}
          </div>

          {/* Valor */}
          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              type="number"
              step="0.0001"
              placeholder="Ej: 0.8500"
              value={formData.valor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, valor: e.target.value }))
              }
            />
            <div className="text-xs text-muted-foreground mt-1">
              Opcional: Dejar vacío si no se conoce el valor específico
            </div>
          </div>

          {/* Lugar de Operación */}
          <div>
            <Label
              htmlFor="lugar_operacion"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Lugar de Operación
            </Label>
            <Input
              id="lugar_operacion"
              type="text"
              placeholder="Ej: Mina Norte - Sector A"
              value={formData.lugar_operacion}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lugar_operacion: e.target.value,
                }))
              }
            />
          </div>

          {/* Usuario ID */}
          <div>
            <Label htmlFor="usuario_id" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuario (ID)
            </Label>
            <Input
              id="usuario_id"
              type="text"
              placeholder="Ej: operador123"
              value={formData.usuario_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, usuario_id: e.target.value }))
              }
            />
          </div>

          {/* Comentario */}
          <div>
            <Label htmlFor="comentario">Comentario</Label>
            <Textarea
              id="comentario"
              placeholder="Descripción opcional del registro..."
              rows={3}
              value={formData.comentario}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comentario: e.target.value }))
              }
            />
          </div>

          {/* Opción de Versión Completa */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="crear_version_completa"
                className="h-4 w-4"
                checked={formData.crear_version_completa}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    crear_version_completa: e.target.checked,
                  }))
                }
              />
              <Label
                htmlFor="crear_version_completa"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Crear versión completa automáticamente
              </Label>
            </div>
            <div className="text-xs text-muted-foreground pl-6">
              Si se activa, se creará una versión JSON completa con todos los
              ratios actuales del modelo, en lugar de solo un ratio individual.
            </div>
          </div>

          {/* Fecha (solo informativo) */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded">
            <Calendar className="h-4 w-4" />
            <span>Fecha efectiva: {new Date().toLocaleString("es-ES")}</span>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !currentModeloId}
              className="flex-1"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {formData.crear_version_completa
                ? "Crear Versión Completa"
                : "Guardar Ratio"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={loading}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
