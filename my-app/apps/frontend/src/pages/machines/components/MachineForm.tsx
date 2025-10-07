import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import supabase, { SUPABASE_BUCKET, getPublicUrl } from "@/lib/supabaseClient";
import {
  CreateMachineDto,
  UpdateMachineDto,
  Machine,
  Marca,
  Equipo,
  DatosAdicionalesMaquina,
} from "../models/types";
import { relationsService } from "../services/relationsService";

interface MachineFormData extends Omit<CreateMachineDto, "modelo_id"> {
  // Campos para crear el modelo
  marca_id?: number;
  equipo_id?: number;
  modelo_nombre?: string;
  porcentaje_utilidad?: number;
  vida_util_fabricante?: number;
  // Campo de información adicional como texto
  informacion_adicional?: string;
  // Datos adicionales estructurados
  datos_adicionales?: DatosAdicionalesMaquina;
}

interface MachineFormProps {
  machine?: Machine; // Si está presente, es edición, si no, es creación
  onSubmit: (data: CreateMachineDto | UpdateMachineDto) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const MachineForm: React.FC<MachineFormProps> = ({
  machine,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState<MachineFormData>({
    estado: "Capex_Nuevo", // Por defecto
    horometro_inicial: undefined,
    link_imagen: "",
    politica_depreciacion: undefined,
    tiempo_entrega: undefined,
    valor_similar_nuevo: undefined,
    valor_venta: undefined,
    vida_util: undefined,
    otros_json: null,
    // Campos para el modelo
    marca_id: undefined,
    equipo_id: undefined,
    modelo_nombre: "",
    porcentaje_utilidad: 0.1, // 10% por defecto
    vida_util_fabricante: undefined,
    // Información adicional como texto
    informacion_adicional: "",
    // Datos adicionales estructurados
    datos_adicionales: {
      procedencia_pais: "",
      potencia_nominal_hp: "",
      consumo_combustible_lh: undefined,
      equipos_comercializados_peru: undefined,
      plazo_entrega_dias: undefined,
      capacitacion_horas: undefined,
      tiempo_atencion_repuestos_dias: undefined,
      ofrece_financiamiento: false,
    },
  });

  // Estados para las opciones
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdditionalData, setShowAdditionalData] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadRelations();
  }, []);

  // Efecto separado para cargar datos del modelo cuando se tienen las relaciones y la máquina
  useEffect(() => {
    if (machine && marcas.length > 0 && equipos.length > 0) {
      setFormData({
        estado: machine.estado || "Capex_Nuevo",
        horometro_inicial: machine.horometro_inicial,
        link_imagen: machine.link_imagen || "",
        politica_depreciacion: machine.politica_depreciacion,
        tiempo_entrega: machine.tiempo_entrega,
        valor_similar_nuevo: machine.valor_similar_nuevo,
        valor_venta: machine.valor_venta,
        vida_util: machine.vida_util,
        otros_json: machine.otros_json,
        // Para edición, extraer datos del modelo existente
        marca_id: machine.modelo?.marca_id,
        equipo_id: machine.modelo?.equipo_id,
        modelo_nombre: machine.modelo?.nombre || "",
        porcentaje_utilidad: machine.modelo?.porcentaje_utilidad || 0.1,
        vida_util_fabricante: machine.modelo?.vida_util_fabricante,
        informacion_adicional: machine.otros_json
          ? JSON.stringify(machine.otros_json, null, 2)
          : "",
        // Datos adicionales estructurados
        datos_adicionales: machine.otros_json || {
          procedencia_pais: "",
          potencia_nominal_hp: "",
          consumo_combustible_lh: undefined,
          equipos_comercializados_peru: undefined,
          plazo_entrega_dias: undefined,
          capacitacion_horas: undefined,
          tiempo_atencion_repuestos_dias: undefined,
          ofrece_financiamiento: false,
        },
      });
    }
  }, [machine, marcas, equipos]);

  const loadRelations = async () => {
    setLoading(true);
    setError("");

    try {
      const [marcasRes, equiposRes] = await Promise.all([
        relationsService.getMarcas(),
        relationsService.getEquipos(),
      ]);

      if (marcasRes.success && marcasRes.data) {
        setMarcas(marcasRes.data);
      }

      if (equiposRes.success && equiposRes.data) {
        setEquipos(equiposRes.data);
      }

      if (!marcasRes.success || !equiposRes.success) {
        setError("Error al cargar algunas opciones");
      }
    } catch (error: any) {
      setError("Error al cargar los datos: " + error.message);
    }

    setLoading(false);
  };

  const handleInputChange = (field: keyof MachineFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field: keyof MachineFormData, value: string) => {
    const numValue = value === "" ? undefined : Number(value);
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleAdditionalDataChange = (
    field: keyof DatosAdicionalesMaquina,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      datos_adicionales: {
        ...prev.datos_adicionales,
        [field]: value,
      },
    }));
  };

  const handleAdditionalDataNumberChange = (
    field: keyof DatosAdicionalesMaquina,
    value: string
  ) => {
    const numValue = value === "" ? undefined : Number(value);
    handleAdditionalDataChange(field, numValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (uploading) {
      setError("La imagen aún se está subiendo. Espera a que termine.");
      return;
    }

    // Validaciones básicas
    if (!formData.marca_id) {
      setError("Debe seleccionar una marca");
      return;
    }
    if (!formData.equipo_id) {
      setError("Debe seleccionar un equipo");
      return;
    }
    if (!formData.modelo_nombre?.trim()) {
      setError("Debe ingresar un nombre para el modelo");
      return;
    }

    try {
      // Procesar datos adicionales estructurados
      let otros_json: DatosAdicionalesMaquina | null = null;

      // Verificar si hay datos adicionales estructurados con valores no vacíos
      const hasAdditionalData =
        formData.datos_adicionales &&
        Object.values(formData.datos_adicionales).some(
          (value) => value !== "" && value !== undefined && value !== null
        );

      if (hasAdditionalData) {
        // Limpiar campos vacíos
        const cleanedData: DatosAdicionalesMaquina = {};
        if (formData.datos_adicionales) {
          Object.entries(formData.datos_adicionales).forEach(([key, value]) => {
            if (value !== "" && value !== undefined && value !== null) {
              (cleanedData as any)[key] = value;
            }
          });
        }
        otros_json = cleanedData;
      }

      // Si no hay datos estructurados pero sí información adicional como texto
      if (!otros_json && formData.informacion_adicional?.trim()) {
        try {
          otros_json = JSON.parse(formData.informacion_adicional);
        } catch {
          // Si no es JSON válido, tratarlo como texto plano
          otros_json = { informacion: formData.informacion_adicional } as any;
        }
      }

      // Preparar datos para enviar
      const machineData: CreateMachineDto | UpdateMachineDto = {
        estado: formData.estado,
        horometro_inicial: formData.horometro_inicial,
        link_imagen: formData.link_imagen,
        politica_depreciacion: formData.politica_depreciacion,
        tiempo_entrega: formData.tiempo_entrega,
        valor_similar_nuevo: formData.valor_similar_nuevo,
        // Asignar automáticamente el valor_similar_nuevo al valor_venta
        valor_venta: formData.valor_similar_nuevo,
        // Aplicar la misma vida útil unificada en horas tanto a la máquina como al modelo
        vida_util: formData.vida_util_fabricante, // Mantener en horas
        otros_json,
        // Incluir datos del modelo para que el backend pueda crearlo o actualizarlo
        ...(!machine && {
          // Solo para creación, incluir datos del modelo
          modelo_data: {
            nombre: formData.modelo_nombre,
            marca_id: formData.marca_id,
            equipo_id: formData.equipo_id,
            porcentaje_utilidad: formData.porcentaje_utilidad,
            vida_util_fabricante: formData.vida_util_fabricante, // Vida útil en horas para el fabricante
          },
        }),
        // Para edición, usar el modelo_id existente e incluir datos del modelo para actualizar
        ...(machine && {
          modelo_id: machine.modelo_id,
          // Incluir datos del modelo para actualización (si el backend lo soporta)
          modelo_data: {
            nombre: formData.modelo_nombre,
            marca_id: formData.marca_id,
            equipo_id: formData.equipo_id,
            porcentaje_utilidad: formData.porcentaje_utilidad,
            vida_util_fabricante: formData.vida_util_fabricante,
          },
        }),
      };

      await onSubmit(machineData);
    } catch (error: any) {
      setError(error.message || "Error al procesar la solicitud");
    }
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      setError("");

      // Validaciones básicas de archivo
      const MAX_SIZE_MB = 5;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        throw new Error(`La imagen supera ${MAX_SIZE_MB}MB`);
      }
      if (!file.type.startsWith("image/")) {
        throw new Error("El archivo seleccionado no es una imagen válida");
      }

      // Nota: No consultar metadata del bucket desde el navegador.
      // Métodos como getBucket/listBuckets requieren Service Key (admin) y fallan con 400/401.
      // Confiamos en el flujo de upload para detectar problemas de bucket o permisos.

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `machines/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (upErr) {
        // Log detallado para depurar
        // eslint-disable-next-line no-console
        console.error("Error al subir imagen:", upErr);
        const status = (upErr as any).statusCode || (upErr as any).status;
        const msg = `${upErr.message || "Error al subir la imagen"}${
          status ? ` (status ${status})` : ""
        }`;
        throw new Error(msg);
      }

      const publicUrl = getPublicUrl(filePath);
      handleInputChange("link_imagen", publicUrl);
      setPreviewUrl(publicUrl);
    } catch (err: any) {
      setError(
        err?.message ||
          "Error al subir la imagen. Verifica que el bucket exista y tenga acceso público."
      );
    } finally {
      setUploading(false);
    }
  };

  const isEditing = !!machine;

  // Estados disponibles
  const ESTADOS_DISPONIBLES = ["Capex_Nuevo", "Capex_Usado"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Datos del Modelo */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">Información del Modelo</h3>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Modifica la información del modelo de esta máquina"
            : "Este modelo se creará automáticamente para esta máquina"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Marca */}
        <div className="space-y-2">
          <Label htmlFor="marca_id">Marca *</Label>
          <Select
            value={formData.marca_id ? formData.marca_id.toString() : ""}
            onValueChange={(value) =>
              handleInputChange("marca_id", Number(value))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loading ? "Cargando..." : "Selecciona una marca"}
              >
                {formData.marca_id && marcas.length > 0
                  ? marcas.find((m) => m.id === formData.marca_id)?.nombre ||
                    "Marca seleccionada"
                  : loading
                    ? "Cargando..."
                    : "Selecciona una marca"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {marcas.map((marca) => (
                <SelectItem key={marca.id} value={marca.id.toString()}>
                  {marca.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equipo */}
        <div className="space-y-2">
          <Label htmlFor="equipo_id">Equipo *</Label>
          <Select
            value={formData.equipo_id ? formData.equipo_id.toString() : ""}
            onValueChange={(value) =>
              handleInputChange("equipo_id", Number(value))
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loading ? "Cargando..." : "Selecciona un equipo"}
              >
                {formData.equipo_id && equipos.length > 0
                  ? equipos.find((e) => e.id === formData.equipo_id)?.nombre ||
                    "Equipo seleccionado"
                  : loading
                    ? "Cargando..."
                    : "Selecciona un equipo"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {equipos.map((equipo) => (
                <SelectItem key={equipo.id} value={equipo.id.toString()}>
                  {equipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nombre del modelo */}
        <div className="space-y-2">
          <Label htmlFor="modelo_nombre">Nombre del Modelo *</Label>
          <Input
            id="modelo_nombre"
            value={formData.modelo_nombre || ""}
            onChange={(e) => handleInputChange("modelo_nombre", e.target.value)}
            placeholder="Ej: CAT320D, PC200-8"
            required
          />
        </div>

        {/* Porcentaje de utilidad */}
        <div className="space-y-2">
          <Label htmlFor="porcentaje_utilidad">Porcentaje de Utilidad</Label>
          <Input
            id="porcentaje_utilidad"
            type="text"
            value={formData.porcentaje_utilidad?.toString() || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                handleInputChange("porcentaje_utilidad", undefined);
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  handleInputChange("porcentaje_utilidad", numValue);
                }
              }
            }}
            placeholder="0.10"
          />
        </div>

        {/* Vida útil unificada */}
        <div className="space-y-2">
          <Label htmlFor="vida_util_unificada">Vida Útil (horas)</Label>
          <Input
            id="vida_util_unificada"
            type="number"
            min="0"
            value={formData.vida_util_fabricante || ""}
            onChange={(e) =>
              handleNumberChange("vida_util_fabricante", e.target.value)
            }
            placeholder="Ej: 30000"
          />
          <p className="text-xs text-muted-foreground">
            Se aplicará tanto al modelo como a la máquina
          </p>
        </div>
      </div>

      {/* Datos de la Máquina */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">Información de la Máquina</h3>
      </div>

      {/* Estado, Horómetro y Valor de Adquisición */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Select
            value={formData.estado}
            onValueChange={(value) => handleInputChange("estado", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_DISPONIBLES.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado.charAt(0).toUpperCase() +
                    estado.slice(1).replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="horometro_inicial">Horómetro Inicial (horas)</Label>
          <Input
            id="horometro_inicial"
            type="number"
            min="0"
            value={formData.horometro_inicial ?? ""}
            onChange={(e) =>
              handleNumberChange("horometro_inicial", e.target.value)
            }
            placeholder="Ej: 1000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_similar_nuevo">
            Valor de Adquisición (USD) *
          </Label>
          <Input
            id="valor_similar_nuevo"
            type="number"
            min="0"
            step="0.01"
            value={formData.valor_similar_nuevo ?? ""}
            onChange={(e) =>
              handleNumberChange("valor_similar_nuevo", e.target.value)
            }
            placeholder="Ej: 100000"
          />
        </div>
      </div>

      {/* Política de Depreciación y Tiempo de Entrega */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="politica_depreciacion">
            Política de Depreciación (%)
          </Label>
          <Input
            id="politica_depreciacion"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.politica_depreciacion ?? ""}
            onChange={(e) =>
              handleNumberChange("politica_depreciacion", e.target.value)
            }
            placeholder="Ej: 15"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiempo_entrega">Tiempo de Entrega (meses)</Label>
          <Input
            id="tiempo_entrega"
            type="number"
            min="0"
            value={formData.tiempo_entrega ?? ""}
            onChange={(e) =>
              handleNumberChange("tiempo_entrega", e.target.value)
            }
            placeholder="Ej: 6"
          />
        </div>
      </div>

      {/* Código de Máquina - Solo información */}
      <div className="space-y-2">
        <Label>Código de Máquina</Label>
        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
          {!isEditing &&
          formData.marca_id &&
          formData.equipo_id &&
          formData.modelo_nombre ? (
            <>
              Se generará automáticamente: <br />
              <strong>
                {equipos
                  .find((e) => e.id === formData.equipo_id)
                  ?.nombre.slice(0, 3)
                  .toUpperCase() || "XXX"}
                -
                {marcas
                  .find((m) => m.id === formData.marca_id)
                  ?.nombre.slice(0, 3)
                  .toUpperCase() || "XXX"}
                -{formData.modelo_nombre.slice(0, 3).toUpperCase() || "XXX"}
                -###
              </strong>
            </>
          ) : isEditing && machine?.id_equipo_interno ? (
            <>
              Código actual: <strong>{machine.id_equipo_interno}</strong>
            </>
          ) : (
            "Se generará automáticamente basado en Equipo + Marca + Modelo"
          )}
        </div>
      </div>

      {/* Imagen de la Máquina */}
      <div className="space-y-2">
        <Label htmlFor="imagen">Imagen de la Máquina</Label>
        <Input
          id="imagen"
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
        />
        {(uploading || formData.link_imagen || previewUrl) && (
          <div className="mt-2 flex items-center gap-3">
            {uploading && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Subiendo imagen...
                </span>
              </>
            )}
            {(previewUrl || formData.link_imagen) && (
              <img
                src={(previewUrl || formData.link_imagen) as string}
                alt="Vista previa"
                className="h-16 w-16 object-cover rounded border"
              />
            )}
          </div>
        )}
        {formData.link_imagen && (
          <p className="text-xs text-muted-foreground break-all">
            URL: {formData.link_imagen}
          </p>
        )}
      </div>

      {/* Información adicional */}
      <div className="space-y-2">
        <Label htmlFor="informacion_adicional">
          Información Adicional (JSON)
        </Label>
        <Textarea
          id="informacion_adicional"
          value={formData.informacion_adicional || ""}
          onChange={(e) =>
            handleInputChange("informacion_adicional", e.target.value)
          }
          placeholder="Información adicional en formato JSON..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Campo legacy. Se recomienda usar los "Datos Adicionales Estructurados"
          a continuación.
        </p>
      </div>

      {/* Datos Adicionales Estructurados */}
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowAdditionalData(!showAdditionalData)}
        >
          <span>Datos Adicionales Estructurados (Opcional)</span>
          {showAdditionalData ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {showAdditionalData && (
          <div className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 bg-muted/10">
              <div className="mb-4">
                <h4 className="text-sm font-medium">
                  Información Técnica y Comercial
                </h4>
                <p className="text-xs text-muted-foreground">
                  Datos estructurados sobre especificaciones técnicas,
                  comerciales y de servicio
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Procedencia País */}
                <div className="space-y-2">
                  <Label htmlFor="procedencia_pais">País de Procedencia</Label>
                  <Input
                    id="procedencia_pais"
                    value={formData.datos_adicionales?.procedencia_pais || ""}
                    onChange={(e) =>
                      handleAdditionalDataChange(
                        "procedencia_pais",
                        e.target.value
                      )
                    }
                    placeholder="Ej: Estados Unidos"
                  />
                </div>

                {/* Potencia Nominal */}
                <div className="space-y-2">
                  <Label htmlFor="potencia_nominal_hp">
                    Potencia Nominal (HP)
                  </Label>
                  <Input
                    id="potencia_nominal_hp"
                    type="text"
                    value={
                      formData.datos_adicionales?.potencia_nominal_hp ?? ""
                    }
                    onChange={(e) =>
                      handleAdditionalDataChange(
                        "potencia_nominal_hp",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 231 HP @ 2,000"
                  />
                </div>

                {/* Consumo de Combustible */}
                <div className="space-y-2">
                  <Label htmlFor="consumo_combustible_lh">
                    Consumo Combustible (L/h)
                  </Label>
                  <Input
                    id="consumo_combustible_lh"
                    type="number"
                    min="0"
                    step="0.1"
                    value={
                      formData.datos_adicionales?.consumo_combustible_lh ?? ""
                    }
                    onChange={(e) =>
                      handleAdditionalDataNumberChange(
                        "consumo_combustible_lh",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 15.5"
                  />
                </div>

                {/* Equipos Comercializados en Perú */}
                <div className="space-y-2">
                  <Label htmlFor="equipos_comercializados_peru">
                    Equipos en Perú
                  </Label>
                  <Input
                    id="equipos_comercializados_peru"
                    type="number"
                    min="0"
                    value={
                      formData.datos_adicionales
                        ?.equipos_comercializados_peru ?? ""
                    }
                    onChange={(e) =>
                      handleAdditionalDataNumberChange(
                        "equipos_comercializados_peru",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 150"
                  />
                </div>

                {/* Plazo de Entrega */}
                <div className="space-y-2">
                  <Label htmlFor="plazo_entrega_dias">
                    Plazo Entrega - equipo (meses)
                  </Label>
                  <Input
                    id="plazo_entrega_dias"
                    type="number"
                    min="0"
                    value={formData.datos_adicionales?.plazo_entrega_dias ?? ""}
                    onChange={(e) =>
                      handleAdditionalDataNumberChange(
                        "plazo_entrega_dias",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 45"
                  />
                </div>

                {/* Horas de Capacitación */}
                <div className="space-y-2">
                  <Label htmlFor="capacitacion_horas">
                    Capacitación (horas)
                  </Label>
                  <Input
                    id="capacitacion_horas"
                    type="number"
                    min="0"
                    value={formData.datos_adicionales?.capacitacion_horas ?? ""}
                    onChange={(e) =>
                      handleAdditionalDataNumberChange(
                        "capacitacion_horas",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 40"
                  />
                </div>

                {/* Tiempo de Atención de Repuestos */}
                <div className="space-y-2">
                  <Label htmlFor="tiempo_atencion_repuestos_dias">
                    Atención Repuestos (días)
                  </Label>
                  <Input
                    id="tiempo_atencion_repuestos_dias"
                    type="text"
                    value={
                      formData.datos_adicionales
                        ?.tiempo_atencion_repuestos_dias ?? ""
                    }
                    onChange={(e) =>
                      handleAdditionalDataChange(
                        "tiempo_atencion_repuestos_dias",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 3-5"
                  />
                </div>

                {/* Ofrece Financiamiento */}
                <div className="space-y-2">
                  <Label htmlFor="ofrece_financiamiento">
                    Ofrece Financiamiento
                  </Label>
                  <Select
                    value={
                      formData.datos_adicionales?.ofrece_financiamiento?.toString() ||
                      "false"
                    }
                    onValueChange={(value) =>
                      handleAdditionalDataChange(
                        "ofrece_financiamiento",
                        value === "true"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || loading || uploading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar" : "Crear"} Máquina
        </Button>
      </div>
    </form>
  );
};
