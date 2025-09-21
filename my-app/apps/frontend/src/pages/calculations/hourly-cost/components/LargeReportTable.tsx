import { HourlyCostReportResponse } from "../models/types";

interface LargeReportTableProps {
  report: HourlyCostReportResponse;
}

export function LargeReportTable({ report }: LargeReportTableProps) {
  const escenarios = [
    ...(report.resultado_completo_json?.escenarios || []),
  ].sort((a, b) => (a.horasMinimas || 0) - (b.horasMinimas || 0));

  const renderSection = (
    title: string,
    rows: {
      label: string;
      get: (esc: any) => number | string | undefined | null;
    }[]
  ) => (
    <div className="mb-6">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left p-3 w-1/3">Métrica</th>
              {escenarios.map((e) => (
                <th key={e.horasMinimas} className="text-left p-3">
                  {e.horasMinimas} hrs
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t">
                <td className="p-3 font-medium">{r.label}</td>
                {escenarios.map((e) => {
                  const v = r.get(e);
                  const isNumber =
                    typeof v === "number" && isFinite(v as number);
                  return (
                    <td key={`${r.label}-${e.horasMinimas}`} className="p-3">
                      {isNumber ? (v as number).toFixed(2) : (v ?? "—")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Función para tabla de valores únicos (no por escenario)
  const renderSingleTable = (title: string, data: any) => (
    <div className="mb-6">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left p-3 w-1/2">Campo</th>
              <th className="text-left p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data || {}).map(([key, value]) => (
              <tr key={key} className="border-t">
                <td className="p-3 font-medium">{key}</td>
                <td className="p-3">
                  {typeof value === "number"
                    ? isFinite(value)
                      ? value.toFixed(4)
                      : String(value)
                    : typeof value === "boolean"
                      ? value
                        ? "Sí"
                        : "No"
                      : String(value ?? "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 1.1 - Descripción (seccion1.descripcion) - Datos únicos del equipo
  const descripcionEquipo =
    escenarios.length > 0 ? escenarios[0].seccion1?.descripcion : {};
  const seccion1Descripcion = renderSingleTable("1.1 - Descripción", {
    Item: descripcionEquipo?.item,
    Equipo: descripcionEquipo?.equipo,
    Marca: descripcionEquipo?.marca,
    Modelo: descripcionEquipo?.modelo,
    Estado: descripcionEquipo?.estado,
    "ID Equipo": descripcionEquipo?.idEquipo,
    "Horómetro Inicial": descripcionEquipo?.horometroInicial,
  });

  // 1.2 - Operación (seccion1.operacion)
  const seccion1Operacion = renderSection("1.2 - Operación", [
    { label: "Horas Mínimas", get: (e) => e.seccion1?.operacion?.horasMinimas },
    {
      label: "Horas Uso Anual",
      get: (e) => e.seccion1?.operacion?.horasUsoAnual,
    },
    {
      label: "Política Depreciación (años)",
      get: (e) => e.seccion1?.operacion?.politicaDepreciacionAnos,
    },
  ]);

  // 2.1 - Descripción (seccion2.descripcion)
  const seccion2Descripcion = renderSection("2.1 - Descripción", [
    { label: "Mes por Año", get: (e) => e.seccion2?.descripcion?.mesPorAnio },
    { label: "Tasa Seguro", get: (e) => e.seccion2?.descripcion?.tasaSeguro },
    { label: "Años Seguro", get: (e) => e.seccion2?.descripcion?.aniosSeguro },
    {
      label: "Factor Mercado",
      get: (e) => e.seccion2?.descripcion?.factorMercado,
    },
    {
      label: "Valor Residual 10",
      get: (e) => e.seccion2?.descripcion?.valorResidual10,
    },
    {
      label: "Depreciación Real",
      get: (e) => e.seccion2?.descripcion?.depreciacionReal,
    },
    {
      label: "Grado Operatividad",
      get: (e) => e.seccion2?.descripcion?.gradoOperatividad,
    },
    {
      label: "Valor Similar Nuevo",
      get: (e) => e.seccion2?.descripcion?.valorSimilarNuevo,
    },
    {
      label: "Tasa Financiamiento",
      get: (e) => e.seccion2?.descripcion?.tasaFinanciamiento,
    },
    {
      label: "Valor Comercial Real",
      get: (e) => e.seccion2?.descripcion?.valorComercialReal,
    },
    {
      label: "Vida Útil Fabricante",
      get: (e) => e.seccion2?.descripcion?.vidaUtilFabricante,
    },
    {
      label: "Años Financiamiento",
      get: (e) => e.seccion2?.descripcion?.aniosFinanciamiento,
    },
    {
      label: "Depreciación Teórica",
      get: (e) => e.seccion2?.descripcion?.depreciacionTeorica,
    },
    {
      label: "Valor Comercial Teórico",
      get: (e) => e.seccion2?.descripcion?.valorComercialTeorico,
    },
    {
      label: "% Valor Comercial Real",
      get: (e) => e.seccion2?.descripcion?.porcentajeValorComercialReal,
    },
  ]);

  // 2.2 - Ratios USD/hr (seccion2.ratiosUsdHr)
  const ratiosKeys =
    escenarios.length > 0
      ? Object.keys(escenarios[0].seccion2?.ratiosUsdHr || {})
      : [];
  const seccion2Ratios = renderSection(
    "2.2 - Ratios USD/hr",
    ratiosKeys.map((key) => ({
      label: key,
      get: (e: any) => e.seccion2?.ratiosUsdHr?.[key],
    }))
  );

  // 3 - Costos fijos (seccion3.posesion)
  const seccion3Fijos = renderSection("3 - Costos horario fijos", [
    {
      label: "3.1 Depreciación",
      get: (e) => e.seccion3?.posesion?.depreciacion,
    },
    {
      label: "3.2 Financiamiento",
      get: (e) => e.seccion3?.posesion?.financiamiento,
    },
    { label: "3.3 Seguro TREC", get: (e) => e.seccion3?.posesion?.seguroTrec },
    {
      label: "Subtotal Fijos",
      get: (e) =>
        e.seccion3?.posesion?.subtotalFijos ?? e.seccion3?.posesion?.subtotal,
    },
    { label: "Utilidad", get: (e) => e.seccion3?.posesion?.utilidad },
    {
      label: "Gastos Distribuibles",
      get: (e) => e.seccion3?.posesion?.gastoDistribuibles,
    },
    {
      label: "Total Costo Fijo",
      get: (e) => e.seccion3?.posesion?.totalCostoFijo,
    },
  ]);

  // 4 - Costos variables (seccion4)
  const seccion4Variables = renderSection("4 - Costos horario variables", [
    {
      label: "4.1 Mantenimiento Preventivo",
      get: (e) => e.seccion4?.mantenimientoPreventivo,
    },
    {
      label: "4.2 Mantenimiento Correctivo",
      get: (e) => e.seccion4?.mantenimientoCorrectivo,
    },
    { label: "4.3 Estructural", get: (e) => e.seccion4?.estructural },
    { label: "4.4 Neumáticos", get: (e) => e.seccion4?.neumaticos },
    {
      label: "4.5 Elementos de Desgaste",
      get: (e) => e.seccion4?.elementosDesgaste,
    },
    { label: "Subtotal Variable", get: (e) => e.seccion4?.subtotalVariable },
    { label: "Utilidad", get: (e) => e.seccion4?.utilidad },
    {
      label: "Total Costo Variable",
      get: (e) => e.seccion4?.totalCostoVariable,
    },
  ]);

  // 5 - Totales
  const seccion5Totales = renderSection("5 - Costo horario total", [
    { label: "Total", get: (e) => e.totales?.total },
    { label: "Fijos + Variables", get: (e) => e.totales?.fijosMasVariables },
  ]);

  // Parámetros (datos únicos, no por escenario)
  const parametros = report.resultado_completo_json?.parametros;
  const seccionParametros = renderSingleTable("Parámetros", parametros);

  // Ratios Meta
  const ratiosMeta = report.resultado_completo_json?.ratiosMeta || [];
  const seccionRatiosMeta =
    ratiosMeta.length > 0 ? (
      <div className="mb-6">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
          Ratios Meta
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Fecha Efectiva</th>
              </tr>
            </thead>
            <tbody>
              {ratiosMeta.map((ratio: any) => (
                <tr key={ratio.id} className="border-t">
                  <td className="p-3">{ratio.id}</td>
                  <td className="p-3">{ratio.tipo}</td>
                  <td className="p-3">{ratio.categoria}</td>
                  <td className="p-3">{ratio.valor}</td>
                  <td className="p-3">
                    {new Date(ratio.fecha_efectiva).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null;

  // Componentes Meta
  const componentesMeta = report.resultado_completo_json?.componentesMeta || [];
  const seccionComponentesMeta =
    componentesMeta.length > 0 ? (
      <div className="mb-6">
        <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold bg-muted/20">
          Componentes Meta
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Componente</th>
                <th className="text-left p-3">PCR</th>
                <th className="text-left p-3">Monto USD</th>
                <th className="text-left p-3">Distribución</th>
                <th className="text-left p-3">Monto Aplicado</th>
                <th className="text-left p-3">Fecha Efectiva</th>
              </tr>
            </thead>
            <tbody>
              {componentesMeta.map((comp: any) => (
                <tr key={comp.id} className="border-t">
                  <td className="p-3">{comp.id}</td>
                  <td className="p-3">{comp.componente}</td>
                  <td className="p-3">{comp.pcr?.toLocaleString()}</td>
                  <td className="p-3">${comp.monto_usd?.toLocaleString()}</td>
                  <td className="p-3">{comp.distribucion?.toFixed(4)}</td>
                  <td className="p-3">
                    ${comp.monto_aplicado_al_proyecto?.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {new Date(comp.fecha_efectiva).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : null;

  return (
    <div>
      {seccion1Descripcion}
      {seccion1Operacion}
      {seccion2Descripcion}
      {seccion2Ratios}
      {seccion3Fijos}
      {seccion4Variables}
      {seccion5Totales}
      {seccionParametros}
      {seccionRatiosMeta}
      {seccionComponentesMeta}
    </div>
  );
}
