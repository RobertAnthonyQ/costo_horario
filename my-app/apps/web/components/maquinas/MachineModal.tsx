import { useState, useEffect } from "react";
import {
  Machine,
  CreateMachineDto,
  MACHINE_ESTADOS,
} from "../../types/machine.types";

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMachineDto) => void;
  machine?: Machine | null; // Si existe, es edición; si no, es creación
  loading?: boolean;
}

export function MachineModal({
  isOpen,
  onClose,
  onSubmit,
  machine = null,
  loading = false,
}: MachineModalProps) {
  const [formData, setFormData] = useState<CreateMachineDto>({
    modelo_id: undefined,
    estado: "Activo",
    horometro_inicial: 0,
    link_imagen: "",
    politica_depreciacion: undefined,
    tiempo_entrega: undefined,
    valor_similar_nuevo: undefined,
    valor_venta: undefined,
    vida_util: undefined,
    otros_json: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Efecto para cargar datos de la máquina en modo edición
  useEffect(() => {
    if (machine) {
      setFormData({
        modelo_id: machine.modelo_id || undefined,
        estado: machine.estado || "Activo",
        horometro_inicial: machine.horometro_inicial || 0,
        link_imagen: machine.link_imagen || "",
        politica_depreciacion: machine.politica_depreciacion || undefined,
        tiempo_entrega: machine.tiempo_entrega || undefined,
        valor_similar_nuevo: machine.valor_similar_nuevo || undefined,
        valor_venta: machine.valor_venta || undefined,
        vida_util: machine.vida_util || undefined,
        otros_json: machine.otros_json || null,
      });
    } else {
      // Resetear formulario para nueva máquina
      setFormData({
        modelo_id: undefined,
        estado: "Activo",
        horometro_inicial: 0,
        link_imagen: "",
        politica_depreciacion: undefined,
        tiempo_entrega: undefined,
        valor_similar_nuevo: undefined,
        valor_venta: undefined,
        vida_util: undefined,
        otros_json: null,
      });
    }
    setErrors({});
  }, [machine, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Convertir valores numéricos
    let processedValue: any = value;
    if (
      [
        "modelo_id",
        "horometro_inicial",
        "politica_depreciacion",
        "tiempo_entrega",
        "valor_similar_nuevo",
        "valor_venta",
        "vida_util",
      ].includes(name)
    ) {
      processedValue = value === "" ? undefined : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas
    if (formData.valor_similar_nuevo && formData.valor_similar_nuevo <= 0) {
      newErrors.valor_similar_nuevo = "El valor debe ser mayor a 0";
    }

    if (formData.valor_venta && formData.valor_venta <= 0) {
      newErrors.valor_venta = "El valor debe ser mayor a 0";
    }

    if (formData.vida_util && formData.vida_util <= 0) {
      newErrors.vida_util = "La vida útil debe ser mayor a 0";
    }

    if (formData.horometro_inicial && formData.horometro_inicial < 0) {
      newErrors.horometro_inicial = "El horómetro no puede ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {machine ? "Editar Máquina" : "Nueva Máquina"}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estado */}
                <div>
                  <label
                    htmlFor="estado"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Estado
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {MACHINE_ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horómetro Inicial */}
                <div>
                  <label
                    htmlFor="horometro_inicial"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Horómetro Inicial (hrs)
                  </label>
                  <input
                    type="number"
                    id="horometro_inicial"
                    name="horometro_inicial"
                    value={formData.horometro_inicial || ""}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.horometro_inicial && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.horometro_inicial}
                    </p>
                  )}
                </div>

                {/* Valor Similar Nuevo */}
                <div>
                  <label
                    htmlFor="valor_similar_nuevo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor Similar Nuevo (USD)
                  </label>
                  <input
                    type="number"
                    id="valor_similar_nuevo"
                    name="valor_similar_nuevo"
                    value={formData.valor_similar_nuevo || ""}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.valor_similar_nuevo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.valor_similar_nuevo}
                    </p>
                  )}
                </div>

                {/* Valor de Venta */}
                <div>
                  <label
                    htmlFor="valor_venta"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor de Venta (USD)
                  </label>
                  <input
                    type="number"
                    id="valor_venta"
                    name="valor_venta"
                    value={formData.valor_venta || ""}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.valor_venta && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.valor_venta}
                    </p>
                  )}
                </div>

                {/* Vida Útil */}
                <div>
                  <label
                    htmlFor="vida_util"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Vida Útil (años)
                  </label>
                  <input
                    type="number"
                    id="vida_util"
                    name="vida_util"
                    value={formData.vida_util || ""}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.vida_util && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.vida_util}
                    </p>
                  )}
                </div>

                {/* Política de Depreciación */}
                <div>
                  <label
                    htmlFor="politica_depreciacion"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Política de Depreciación (%)
                  </label>
                  <input
                    type="number"
                    id="politica_depreciacion"
                    name="politica_depreciacion"
                    value={formData.politica_depreciacion || ""}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tiempo de Entrega */}
                <div>
                  <label
                    htmlFor="tiempo_entrega"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tiempo de Entrega (días)
                  </label>
                  <input
                    type="number"
                    id="tiempo_entrega"
                    name="tiempo_entrega"
                    value={formData.tiempo_entrega || ""}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Modelo ID */}
                <div>
                  <label
                    htmlFor="modelo_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    ID del Modelo
                  </label>
                  <input
                    type="number"
                    id="modelo_id"
                    name="modelo_id"
                    value={formData.modelo_id || ""}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Imagen URL - Full Width */}
              <div className="mt-6">
                <label
                  htmlFor="link_imagen"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  id="link_imagen"
                  name="link_imagen"
                  value={formData.link_imagen || ""}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Vista previa de imagen */}
              {formData.link_imagen && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vista Previa
                  </label>
                  <div className="relative h-32 w-48 bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={formData.link_imagen}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget
                          .parentNode as HTMLElement;
                        parent.innerHTML =
                          '<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm">Error al cargar imagen</div>';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Guardando..."
                  : machine
                    ? "Actualizar"
                    : "Crear Máquina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
