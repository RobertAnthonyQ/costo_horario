import { PICRecord } from "../models/types";
import { useMemo } from "react";

function formatNum(
  val: number | null | undefined,
  opts: { fixed?: number; fallback?: string } = {}
) {
  const { fixed, fallback = "-" } = opts;
  if (val === null || val === undefined || isNaN(val)) return fallback;
  if (typeof fixed === "number") return val.toFixed(fixed);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface Props {
  records: PICRecord[];
  loading?: boolean;
}

export const PICsTable: React.FC<Props> = ({ records, loading }) => {
  const rows = useMemo(() => {
    const recordsArray = records ?? [];
    // Ordenar por componente_id para mantener consistencia con el panel de edición
    return recordsArray.sort((a, b) => a.componente_id - b.componente_id);
  }, [records]);

  return (
    <div className="border rounded-md overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-2">Fecha</th>
            <th className="p-2">Modelo</th>
            <th className="p-2">Componente</th>
            <th className="p-2 text-right">PCR</th>
            <th className="p-2 text-right">Monto USD</th>
            <th className="p-2 text-right">Distribución</th>
            <th className="p-2 text-right">Monto Aplicado</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-muted-foreground">
                Cargando...
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-muted-foreground">
                Sin registros
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const modeloNombre = r.modelo?.nombre || `#${r.modelo_id}`;
            const componenteNombre =
              r.componente?.nombre || `#${r.componente_id}`;
            return (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2 whitespace-nowrap">
                  {new Date(r.fecha_efectiva).toLocaleDateString()}
                </td>
                <td className="p-2 whitespace-nowrap" title={modeloNombre}>
                  <span className="inline-block max-w-[180px] truncate align-bottom">
                    {modeloNombre}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">{componenteNombre}</td>
                <td className="p-2 text-right">
                  {formatNum(r.pcr, { fixed: 4 })}
                </td>
                <td className="p-2 text-right">{formatNum(r.monto_usd)}</td>
                <td className="p-2 text-right">
                  {formatNum(r.distribucion, { fixed: 4 })}
                </td>
                <td className="p-2 text-right font-medium">
                  {formatNum(r.monto_aplicado_al_proyecto)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
