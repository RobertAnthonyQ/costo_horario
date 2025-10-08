import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { picsService } from "../services/picsService";
import { PICRecord } from "../models/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { componentesService, Componente } from "@/services/componentesService";

interface Props {
  modeloId: number;
}

interface EditableRowState {
  pcr?: string; // valor editado (string para input)
  monto_usd?: string; // valor editado
  original_pcr?: number | null; // referencia original para detectar cambios
  original_monto?: number | null;
  dirty: boolean; // si hay cambios en cualquiera de los dos
  error?: string | null;
}

export const PICsEditorPanel: React.FC<Props> = ({ modeloId }) => {
  // TODO: Enhancement - traer lista maestra de componentes para el modelo y permitir asignar
  // valores iniciales a los que aún no tienen registro histórico.
  const qc = useQueryClient();
  const [rowState, setRowState] = useState<Record<number, EditableRowState>>(
    {}
  );

  const { data: latestResp, isLoading } = useQuery({
    queryKey: ["pics", "latest-by-modelo", modeloId],
    queryFn: () => picsService.latestByModelo(modeloId),
    enabled: !!modeloId,
  });

  const { data: allComponentesResp, isLoading: loadingComponentes } = useQuery({
    queryKey: ["componentes", "all"],
    queryFn: () => componentesService.getComponentes(),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      id?: number; // si existe -> patch
      modelo_id: number;
      componente_id: number;
      pcr?: number | null;
      monto_usd?: number | null;
      isNew?: boolean;
    }) => {
      if (vars.id && !vars.isNew) {
        // PATCH sólo con campos definidos
        const payload: { pcr?: number | null; monto_usd?: number | null } = {};
        if (vars.pcr !== undefined) payload.pcr = vars.pcr;
        if (vars.monto_usd !== undefined) payload.monto_usd = vars.monto_usd;
        return picsService.updateRecord(vars.id, payload);
      }
      return picsService.createRecord({
        modelo_id: vars.modelo_id,
        componente_id: vars.componente_id,
        pcr: vars.pcr,
        monto_usd: vars.monto_usd,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["pics", "by-modelo", modeloId] });
      qc.invalidateQueries({
        queryKey: ["pics", "latest-by-modelo", modeloId],
      });
      qc.invalidateQueries({
        queryKey: ["pics", "total-resumen-by-modelo", modeloId],
      });
    },
  });

  const records: PICRecord[] = latestResp?.data || [];

  const allComponentes: Componente[] = allComponentesResp?.data || [];
  // Mostrar solo filas existentes
  const mergedRows = [...records].sort(
    (a, b) => a.componente_id - b.componente_id
  );

  // Inicializar estado editable para filas existentes cuando cambie mergedRows
  useEffect(() => {
    if (!mergedRows.length) return;
    setRowState((prev) => {
      let changed = false;
      const next = { ...prev } as Record<number, EditableRowState>;
      mergedRows.forEach((r) => {
        if (!next[r.id]) {
          next[r.id] = {
            pcr: r.pcr != null ? r.pcr.toString() : "",
            monto_usd: r.monto_usd != null ? r.monto_usd.toString() : "",
            original_pcr: r.pcr ?? null,
            original_monto: r.monto_usd ?? null,
            dirty: false,
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [mergedRows]);

  const handleChange = (
    r: PICRecord,
    field: "pcr" | "monto_usd",
    value: string
  ) => {
    setRowState((prev) => {
      const current =
        prev[r.id] ||
        ({
          pcr: r.pcr != null ? r.pcr.toString() : "",
          monto_usd: r.monto_usd != null ? r.monto_usd.toString() : "",
          original_pcr: r.pcr ?? null,
          original_monto: r.monto_usd ?? null,
          dirty: false,
        } as EditableRowState);
      const next: EditableRowState = {
        ...current,
        pcr: field === "pcr" ? value : current.pcr,
        monto_usd: field === "monto_usd" ? value : current.monto_usd,
        original_pcr: current.original_pcr ?? r.pcr ?? null,
        original_monto: current.original_monto ?? r.monto_usd ?? null,
        dirty: false,
      };
      const changedPcr =
        (next.pcr ?? "") !==
        (next.original_pcr != null ? next.original_pcr.toString() : "");
      const changedMonto =
        (next.monto_usd ?? "") !==
        (next.original_monto != null ? next.original_monto.toString() : "");
      next.dirty = changedPcr || changedMonto;
      return { ...prev, [r.id]: next };
    });
  };

  const batchSave = () => {
    const ops = mergedRows.filter((r) => rowState[r.id]?.dirty);
    if (!ops.length) return;
    ops.forEach((r) => {
      const st = rowState[r.id];
      if (!st) return;
      const isNew = false;
      const changed: { pcr?: number | null; monto_usd?: number | null } = {};
      if (
        (st.pcr ?? "") !==
        (st.original_pcr != null ? st.original_pcr.toString() : "")
      ) {
        changed.pcr = st.pcr === "" ? null : Number(st.pcr);
      }
      if (
        (st.monto_usd ?? "") !==
        (st.original_monto != null ? st.original_monto.toString() : "")
      ) {
        changed.monto_usd = st.monto_usd === "" ? null : Number(st.monto_usd);
      }
      if (Object.keys(changed).length === 0) return;
      mutation.mutate({
        id: r.id,
        modelo_id: r.modelo_id,
        componente_id: r.componente_id,
        pcr: changed.pcr,
        monto_usd: changed.monto_usd,
        isNew,
      });
    });
  };

  // Formulario para agregar nuevo componente y valores
  const [newCompId, setNewCompId] = useState<string>("");
  const [newPcr, setNewPcr] = useState<string>("");
  const [newMonto, setNewMonto] = useState<string>("");

  const addNew = () => {
    if (!newCompId) return;
    const pcrVal = newPcr.trim() === "" ? null : Number(newPcr);
    const montoVal = newMonto.trim() === "" ? null : Number(newMonto);
    if (
      (pcrVal !== null && isNaN(pcrVal)) ||
      (montoVal !== null && isNaN(montoVal))
    ) {
      return;
    }
    mutation.mutate({
      modelo_id: modeloId,
      componente_id: Number(newCompId),
      pcr: pcrVal,
      monto_usd: montoVal,
      isNew: true,
    });
    setNewCompId("");
    setNewPcr("");
    setNewMonto("");
  };

  return (
    <div className="border rounded-md p-3 h-full flex flex-col">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando...
        </div>
      )}

      <div className="flex-1 overflow-auto pr-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left border-b">
              <th className="py-1 pr-2">Componente</th>
              <th className="py-1 pr-2 text-right">PCR</th>
              <th className="py-1 pr-2 text-right">Monto USD</th>
              <th className="py-1 pr-2 text-right">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {mergedRows.map((r) => {
              const st: EditableRowState = rowState[r.id] || {
                pcr: r.pcr != null ? r.pcr.toString() : "",
                monto_usd: r.monto_usd != null ? r.monto_usd.toString() : "",
                original_pcr: r.pcr ?? null,
                original_monto: r.monto_usd ?? null,
                dirty: false,
              };
              const isNew = r.id < 0 || (r.pcr == null && r.monto_usd == null);
              return (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td
                    className="py-1 pr-2 whitespace-nowrap max-w-[140px] truncate"
                    title={r.componente?.nombre}
                  >
                    <span className="flex items-center gap-1">
                      {r.componente?.nombre || `#${r.componente_id}`}
                      {isNew && (
                        <span className="text-[10px] px-1 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          Nuevo
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-1 pr-2">
                    <Input
                      className="h-7 text-right"
                      value={st.pcr}
                      placeholder=""
                      onChange={(e) => handleChange(r, "pcr", e.target.value)}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <Input
                      className="h-7 text-right"
                      value={st.monto_usd}
                      placeholder=""
                      onChange={(e) =>
                        handleChange(r, "monto_usd", e.target.value)
                      }
                    />
                  </td>
                  <td className="py-1 pr-2 text-right">
                    {st.dirty && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        Modificado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {mergedRows.length === 0 && !isLoading && !loadingComponentes && (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-muted-foreground"
                >
                  Sin componentes
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Nuevo registro (abajo) */}
        <div className="mt-3 grid grid-cols-12 gap-2 items-end">
          <div className="col-span-6">
            <label className="text-[10px] text-muted-foreground">
              Componente
            </label>
            <Select value={newCompId} onValueChange={setNewCompId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingComponentes
                      ? "Cargando..."
                      : "Seleccionar componente"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-72">
                {allComponentes
                  .filter(
                    (c) => !mergedRows.some((r) => r.componente_id === c.id)
                  )
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <label className="text-[10px] text-muted-foreground">PCR</label>
            <Input
              value={newPcr}
              onChange={(e) => setNewPcr(e.target.value)}
              placeholder="ej: 0.1234"
            />
          </div>
          <div className="col-span-3">
            <label className="text-[10px] text-muted-foreground">
              Monto USD
            </label>
            <Input
              value={newMonto}
              onChange={(e) => setNewMonto(e.target.value)}
              placeholder="ej: 1000"
            />
          </div>
          <div className="col-span-12 flex justify-end">
            <Button
              size="sm"
              onClick={addNew}
              disabled={mutation.isPending || !newCompId}
            >
              {mutation.isPending && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              Agregar componente
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button size="sm" onClick={batchSave} disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          )}
          Guardar cambios
        </Button>
        {mutation.isError && (
          <div className="text-destructive text-xs">
            Error: {(mutation.error as any)?.message}
          </div>
        )}
      </div>
    </div>
  );
};
