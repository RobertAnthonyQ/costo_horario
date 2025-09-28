import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HourlyCostReportResponse } from "../models/types";
import { LargeReportTable } from "./LargeReportTable";

// Helper para formatear números con separador de miles (coma) y 2 decimales
// Ej: 12345.6 -> 12,345.60
const formatNumber = (
  value: number | null | undefined,
  opts: Intl.NumberFormatOptions = {}
) => {
  if (value === null || value === undefined || isNaN(value as number))
    return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value as number);
};

interface ReportDisplayProps {
  report: HourlyCostReportResponse | null;
  selectedMachine: any;
  showReportModal: boolean;
  onCloseModal: () => void;
}

export function ReportDisplay({
  report,
  selectedMachine,
  showReportModal,
  onCloseModal,
}: ReportDisplayProps) {
  console.log("🎭 ReportDisplay recibió report:", report);
  console.log("🎭 ReportDisplay escenarios disponibles:", report?.escenarios);
  console.log(
    "🎭 ReportDisplay resultado_completo_json:",
    report?.resultado_completo_json
  );

  if (!report) {
    return null;
  }

  return (
    <>
      {/* Modal con detalle completo */}
      <Dialog open={showReportModal} onOpenChange={onCloseModal}>
        <DialogContent className="max-w-[1100px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informe Costo Horario - Detalle</DialogTitle>
            <DialogDescription>
              Vista detallada de los escenarios de costo horario calculados para
              la máquina seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 mb-4">
            <div>
              <div className="font-semibold">
                {report.machine?.id_equipo_interno ||
                  selectedMachine?.id_equipo_interno ||
                  `Máquina ${report.machine?.id ?? selectedMachine?.id}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {report.machine?.modelo?.marca?.nombre ||
                  selectedMachine?.modelo?.marca?.nombre}{" "}
                •{" "}
                {report.machine?.modelo?.nombre ||
                  selectedMachine?.modelo?.nombre}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Fecha:{" "}
              {report.fecha_calculo
                ? new Date(report.fecha_calculo).toLocaleString("es-ES")
                : "Cálculo actual"}
            </div>
          </div>
          <LargeReportTable report={report} />
        </DialogContent>
      </Dialog>

      {/* Resumen compacto en la página */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Informe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMachine && (
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
              <div>
                <div className="font-semibold">
                  {selectedMachine.id_equipo_interno ||
                    `Máquina ${selectedMachine.id}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedMachine?.modelo?.marca?.nombre} •{" "}
                  {selectedMachine?.modelo?.nombre}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Fecha:{" "}
                {report.fecha_calculo
                  ? new Date(report.fecha_calculo).toLocaleString("es-ES")
                  : "Cálculo actual"}
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border rounded-md overflow-hidden">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left p-3">Horas mínimas</th>
                  <th className="text-left p-3">Costo fijo (US$/hr)</th>
                  <th className="text-left p-3">Costo variable (US$/hr)</th>
                  <th className="text-left p-3">Total (US$/hr)</th>
                </tr>
              </thead>
              <tbody>
                {(
                  report.resultado_completo_json?.escenarios ||
                  report.escenarios ||
                  []
                ).map((esc) => (
                  <tr key={esc.horasMinimas} className="border-t">
                    <td className="p-3">
                      {new Intl.NumberFormat("en-US").format(esc.horasMinimas)}
                    </td>
                    <td className="p-3">
                      {formatNumber(esc.seccion3?.posesion?.totalCostoFijo)}
                    </td>
                    <td className="p-3">
                      {formatNumber(esc.seccion4?.totalCostoVariable)}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatNumber(esc.totales?.fijosMasVariables)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
