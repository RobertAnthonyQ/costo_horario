import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, Eye } from "lucide-react";
import { HourlyCostReportResponse } from "../models/types";
import { hourlyCostService } from "../services/hourlyCostService";

interface HistorySectionProps {
  machineId: string;
  history: HourlyCostReportResponse[];
  historyLoading: boolean;
  dateFilter: { from?: string; to?: string };
  onDateFilterChange: (filter: { from?: string; to?: string }) => void;
  onReportSelect: (report: HourlyCostReportResponse) => void;
}

export function HistorySection({
  machineId,
  history,
  historyLoading,
  dateFilter,
  onDateFilterChange,
  onReportSelect,
}: HistorySectionProps) {
  if (!machineId) {
    return null;
  }

  const handleViewReport = async (reportId: number) => {
    const res = await hourlyCostService.getReportById(reportId);
    if (res.success && res.data) {
      onReportSelect(res.data);
    }
  };

  const filteredHistory = history.filter((h) => {
    if (!dateFilter.from && !dateFilter.to) return true;
    const d = new Date(h.fecha_calculo).toISOString().slice(0, 10);
    if (dateFilter.from && d < dateFilter.from) return false;
    if (dateFilter.to && d > dateFilter.to) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" /> Historial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Desde</Label>
            <Input
              type="date"
              value={dateFilter.from || ""}
              onChange={(e) =>
                onDateFilterChange({ ...dateFilter, from: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input
              type="date"
              value={dateFilter.to || ""}
              onChange={(e) =>
                onDateFilterChange({ ...dateFilter, to: e.target.value })
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3">Fecha cálculo</th>
                <th className="text-left p-3">Comentario</th>
                <th className="text-left p-3">Escenarios</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-3">
                    {new Date(h.fecha_calculo).toLocaleString("es-ES")}
                  </td>
                  <td className="p-3">
                    {h.resultado_completo_json?.comentario || "—"}
                  </td>
                  <td className="p-3">
                    {h.resultado_completo_json?.escenarios?.length || 0}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReport(h.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </td>
                </tr>
              ))}
              {historyLoading && (
                <tr>
                  <td colSpan={4} className="p-3 text-muted-foreground">
                    Cargando historial...
                  </td>
                </tr>
              )}
              {!historyLoading && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-3 text-muted-foreground">
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
