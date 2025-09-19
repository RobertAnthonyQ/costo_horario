import { Machine } from "../../types/machine.types";

interface MachineCardProps {
  machine: Machine;
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
  onView: (machine: Machine) => void;
}

function MachineCard({ machine, onEdit, onDelete, onView }: MachineCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEstadoBadge = (estado: string | null | undefined) => {
    if (!estado) return null;

    const badgeClasses = {
      Activo: "bg-green-100 text-green-800",
      Mantenimiento: "bg-orange-100 text-orange-800",
      Inactivo: "bg-gray-100 text-gray-800",
      "En Reparación": "bg-red-100 text-red-800",
      Vendido: "bg-blue-100 text-blue-800",
      Capex_Nuevo: "bg-purple-100 text-purple-800",
    };

    const className =
      badgeClasses[estado as keyof typeof badgeClasses] ||
      "bg-gray-100 text-gray-800";

    return (
      <span
        className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${className}`}
      >
        {estado}
      </span>
    );
  };

  const generateMachineCode = (machine: Machine) => {
    const equipo = machine.modelo?.equipo?.nombre || "EQ";
    const id = machine.id.toString().padStart(3, "0");
    return `${equipo.substring(0, 2).toUpperCase()}-${id}`;
  };

  return (
    <div className="bg-white rounded-lg border hover:shadow-sm transition-shadow duration-200">
      {/* Imagen */}
      <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
        {machine.link_imagen ? (
          <img
            src={machine.link_imagen}
            alt={`${machine.modelo?.marca?.nombre} ${machine.modelo?.nombre}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-machine.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
            <div className="text-center">
              <div className="text-4xl mb-2">🚛</div>
              <p className="text-sm text-gray-500">Sin imagen</p>
            </div>
          </div>
        )}

        {/* Estado badge en la imagen */}
        <div className="absolute top-3 right-3">
          {getEstadoBadge(machine.estado)}
        </div>

        {/* Código en la imagen */}
        <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
          {generateMachineCode(machine)}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {machine.modelo?.marca?.nombre || "Sin marca"}{" "}
            {machine.modelo?.nombre || "Sin modelo"}
          </h3>
          <p className="text-sm text-gray-600">
            {machine.modelo?.equipo?.nombre || "Sin tipo de equipo"}
          </p>
        </div>

        {/* Detalles */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Valor Similar Nuevo</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(machine.valor_similar_nuevo)}
            </span>
          </div>

          {machine.valor_venta && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Valor de Venta</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(machine.valor_venta)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Horómetro</span>
            <span className="text-sm font-medium text-gray-900">
              {machine.horometro_inicial
                ? `${machine.horometro_inicial.toLocaleString()} hrs`
                : "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Vida Útil</span>
            <span className="text-sm font-medium text-gray-900">
              {machine.vida_util ? `${machine.vida_util} años` : "N/A"}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex space-x-2 pt-4 border-t">
          <button
            onClick={() => onView(machine)}
            className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            Ver Detalles
          </button>
          <button
            onClick={() => onEdit(machine)}
            className="flex-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(machine)}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface MachineCardsProps {
  machines: Machine[];
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
  onView: (machine: Machine) => void;
  loading?: boolean;
}

export function MachineCards({
  machines,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: MachineCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="text-6xl mb-4">🚛</div>
          <p className="text-lg font-medium mb-2">
            No hay máquinas registradas
          </p>
          <p className="text-sm text-gray-400">
            Comienza agregando una nueva máquina
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {machines.map((machine) => (
        <MachineCard
          key={machine.id}
          machine={machine}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}
