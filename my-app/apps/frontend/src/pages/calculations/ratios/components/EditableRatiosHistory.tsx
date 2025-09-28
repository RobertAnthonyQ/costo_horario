import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Save, X, Info } from "lucide-react";
import { RatioType, RatioVersion } from "../models/types";

interface EditableRatiosHistoryProps {
  selectedMachine: string;
  currentModeloId: number | null;
  ratioTypes: RatioType[];
  latestByTipoMap: Record<number, RatioVersion>;
  loadingHistory: boolean;
  onSave: (tipoId: number, value: string, comentario?: string) => Promise<void>;
}

export default function EditableRatiosHistory({
  selectedMachine,
  currentModeloId,
  ratioTypes,
  latestByTipoMap,
  loadingHistory,
  onSave,
}: EditableRatiosHistoryProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<number, string>>(
    {}
  );
  const [editingComments, setEditingComments] = useState<
    Record<number, string>
  >({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  // Inicializar valores de edición cuando se entra en modo edición
  const enterEditMode = () => {
    const values: Record<number, string> = {};
    const comments: Record<number, string> = {};

    ratioTypes.forEach((tipo) => {
      const latest = latestByTipoMap[tipo.id];
      values[tipo.id] =
        latest && latest.valor != null ? String(latest.valor) : "";
      comments[tipo.id] = latest?.comentario || "";
    });

    setEditingValues(values);
    setEditingComments(comments);
    setIsEditMode(true);
  };

  // Salir del modo edición
  const exitEditMode = () => {
    setIsEditMode(false);
    setEditingValues({});
    setEditingComments({});
    setSavingIds(new Set());
  };

  // Guardar un ratio individual
  const handleSaveRatio = async (tipoId: number) => {
    setSavingIds((prev) => new Set([...prev, tipoId]));

    try {
      const value = editingValues[tipoId] || "";
      const comentario = editingComments[tipoId] || "";
      await onSave(tipoId, value, comentario);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tipoId);
        return next;
      });
    }
  };

  // Guardar todos los ratios
  const handleSaveAll = async () => {
    const allIds = ratioTypes.map((t) => t.id);
    setSavingIds(new Set(allIds));

    try {
      for (const tipo of ratioTypes) {
        const value = editingValues[tipo.id] || "";
        const comentario = editingComments[tipo.id] || "";
        await onSave(tipo.id, value, comentario);
      }
      setIsEditMode(false);
    } finally {
      setSavingIds(new Set());
    }
  };

  if (!selectedMachine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ratios del Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Selecciona una máquina para ver y editar sus ratios
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ratios del Modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">Cargando ratios...</div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar tipos de ratio por categoría
  const groups: Record<string, RatioType[]> = {};
  ratioTypes.forEach((t) => {
    const cat = t.categoria || "Sin categoría";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  });

  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  const sortedCats = Object.keys(groups).sort((a, b) => collator.compare(a, b));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ratios del Modelo</CardTitle>
          <div className="flex gap-2">
            {!isEditMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={enterEditMode}
                disabled={!currentModeloId}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={exitEditMode}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={savingIds.size > 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Todo
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {ratioTypes.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay tipos de ratio configurados
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCats.map((cat) => (
              <div key={cat}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  {cat}
                </div>
                <div className="space-y-3">
                  {groups[cat]
                    .sort((a, b) => collator.compare(a.nombre, b.nombre))
                    .map((tipo) => {
                      const latest = latestByTipoMap[tipo.id];
                      const isLoading = savingIds.has(tipo.id);

                      return (
                        <div
                          key={tipo.id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{tipo.nombre}</Label>
                            {latest && (
                              <div className="text-xs text-muted-foreground">
                                Última actualización:{" "}
                                {new Date(
                                  latest.fecha_efectiva
                                ).toLocaleDateString("es-ES")}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Valor
                              </Label>
                              {isEditMode ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingValues[tipo.id] || ""}
                                  onChange={(e) =>
                                    setEditingValues((prev) => ({
                                      ...prev,
                                      [tipo.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isLoading}
                                  className="mt-1"
                                />
                              ) : (
                                <div className="mt-1 p-2 bg-muted rounded text-sm">
                                  {latest && latest.valor != null
                                    ? latest.valor
                                    : "—"}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Comentario
                              </Label>
                              {isEditMode ? (
                                <Input
                                  placeholder="Comentario opcional..."
                                  value={editingComments[tipo.id] || ""}
                                  onChange={(e) =>
                                    setEditingComments((prev) => ({
                                      ...prev,
                                      [tipo.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isLoading}
                                  className="mt-1"
                                />
                              ) : (
                                <div className="mt-1 p-2 bg-muted rounded text-sm">
                                  {latest?.comentario || "Sin comentario"}
                                </div>
                              )}
                            </div>
                          </div>

                          {isEditMode && (
                            <div className="flex items-center justify-end pt-2 text-xs text-muted-foreground">
                              <Info className="h-4 w-4 mr-2" />
                              Los cambios se guardan con "Guardar Todo" arriba
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
