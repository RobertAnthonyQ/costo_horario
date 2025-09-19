import { Machine } from "../../types/machine.types";

interface MachineTableProps {
  machines: Machine[];
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
  onView: (machine: Machine) => void;
  loading?: boolean;
}

export function MachineTable({
  machines,
  onEdit,
  onDelete,
  onView,
  loading = false,
}: MachineTableProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "-";
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHours = (value: number | null | undefined) => {
    if (!value) return "-";
    return `${value.toLocaleString()} hrs`;
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-foreground">
          Lista de Máquinas
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Equipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Marca/Modelo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Horómetro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vida Útil
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {machines.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-muted-foreground">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p className="mt-2 text-sm">No hay máquinas registradas</p>
                    <p className="text-xs text-gray-400">
                      Comienza agregando una nueva máquina
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              machines.map((machine) => (
                <tr key={machine.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {generateMachineCode(machine)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center">
                      {machine.link_imagen ? (
                        <img
                          src={machine.link_imagen}
                          alt="Máquina"
                          className="h-10 w-14 rounded object-cover mr-3"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-machine.svg";
                          }}
                        />
                      ) : (
                        <div className="h-10 w-14 bg-muted rounded flex items-center justify-center mr-3">
                          🚛
                        </div>
                      )}
                      {machine.modelo?.equipo?.nombre || "Sin equipo"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div>
                      <div className="font-medium">
                        {machine.modelo?.marca?.nombre || "Sin marca"}
                      </div>
                      <div className="text-muted-foreground">
                        {machine.modelo?.nombre || "Sin modelo"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(machine.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatHours(machine.horometro_inicial)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div>
                      <div className="font-medium">
                        {formatCurrency(machine.valor_similar_nuevo)}
                      </div>
                      {machine.valor_venta && (
                        <div className="text-muted-foreground text-xs">
                          Venta: {formatCurrency(machine.valor_venta)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {machine.vida_util ? `${machine.vida_util} años` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(machine)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEdit(machine)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(machine)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
