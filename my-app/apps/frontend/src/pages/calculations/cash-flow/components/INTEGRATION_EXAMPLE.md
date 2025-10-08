# 🔧 Guía de Integración - Modal de Amortización

## Archivos Modificados

1. ✅ `ParametersForm.tsx` - Botón para ver amortización de máquina seleccionada
2. ✅ `HistorySection.tsx` - Botón para ver amortización de versiones guardadas
3. ✅ `flujoCajaService.ts` - Servicios para endpoints de amortización
4. ✅ `AmortizacionModal.tsx` - Componente modal con la tabla

---

## 📝 Cómo Integrar en la Página Principal

### 1. Importar el Modal

```typescript
// En tu archivo index.tsx o página principal de flujo de caja
import { AmortizacionModal } from "./components/AmortizacionModal";
```

### 2. Agregar Estado para el Modal

```typescript
const [amortizacionModal, setAmortizacionModal] = useState<{
  open: boolean;
  machineId?: number;
  flujoHistorialId?: number;
}>({
  open: false,
});
```

### 3. Crear Handlers

```typescript
// Handler para abrir modal desde ParametersForm (máquina seleccionada)
const handleViewAmortizacion = () => {
  if (machineId) {
    setAmortizacionModal({
      open: true,
      machineId: parseInt(machineId),
    });
  }
};

// Handler para abrir modal desde HistorySection (versión guardada)
const handleViewAmortizacionVersion = (version: FlujoCajaVersion) => {
  setAmortizacionModal({
    open: true,
    flujoHistorialId: version.id,
  });
};

// Handler para cerrar modal
const handleCloseAmortizacion = () => {
  setAmortizacionModal({ open: false });
};
```

### 4. Pasar Handlers a los Componentes

```typescript
<ParametersForm
  // ... otros props
  onViewAmortizacion={handleViewAmortizacion}
/>

<HistorySection
  // ... otros props
  onViewAmortizacion={handleViewAmortizacionVersion}
/>
```

### 5. Agregar el Modal en el JSX

```typescript
return (
  <div>
    {/* Tus componentes existentes */}
    <ParametersForm {...props} />
    <HistorySection {...props} />
    <ReportDisplay {...props} />

    {/* Modal de amortización */}
    <AmortizacionModal
      open={amortizacionModal.open}
      onClose={handleCloseAmortizacion}
      machineId={amortizacionModal.machineId}
      flujoHistorialId={amortizacionModal.flujoHistorialId}
    />
  </div>
);
```

---

## 📋 Ejemplo Completo de Integración

```typescript
import { useState } from "react";
import { ParametersForm } from "./components/ParametersForm";
import { HistorySection } from "./components/HistorySection";
import { AmortizacionModal } from "./components/AmortizacionModal";
import { FlujoCajaVersion } from "./models/types";

export default function FlujoCajaPage() {
  // ... estados existentes ...
  const [machineId, setMachineId] = useState("");
  const [versions, setVersions] = useState<FlujoCajaVersion[]>([]);

  // Estado para el modal de amortización
  const [amortizacionModal, setAmortizacionModal] = useState<{
    open: boolean;
    machineId?: number;
    flujoHistorialId?: number;
  }>({
    open: false,
  });

  // Handler: Ver amortización de máquina seleccionada
  const handleViewAmortizacion = () => {
    if (machineId) {
      console.log("🔍 Abriendo modal de amortización para máquina:", machineId);
      setAmortizacionModal({
        open: true,
        machineId: parseInt(machineId),
      });
    }
  };

  // Handler: Ver amortización de versión guardada
  const handleViewAmortizacionVersion = (version: FlujoCajaVersion) => {
    console.log("🔍 Abriendo modal de amortización para versión:", version.id);
    setAmortizacionModal({
      open: true,
      flujoHistorialId: version.id,
    });
  };

  // Handler: Cerrar modal
  const handleCloseAmortizacion = () => {
    console.log("❌ Cerrando modal de amortización");
    setAmortizacionModal({ open: false });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Formulario de parámetros */}
      <ParametersForm
        machines={machines}
        machineId={machineId}
        versions={versions}
        selectedVersion={selectedVersion}
        params={params}
        loadingMachines={loadingMachines}
        versionsLoading={versionsLoading}
        calculatingPreview={calculatingPreview}
        savingReport={savingReport}
        showHistory={showHistory}
        onMachineChange={setMachineId}
        onVersionSelect={handleVersionSelect}
        onParamsChange={setParams}
        onPreview={handlePreview}
        onSave={handleSave}
        onToggleHistory={handleToggleHistory}
        onViewVersionDetails={handleViewVersionDetails}
        onViewAmortizacion={handleViewAmortizacion} // ⬅️ NUEVO
      />

      {/* Historial de versiones */}
      {showHistory && (
        <HistorySection
          versions={versions}
          versionsLoading={versionsLoading}
          onViewDetails={handleViewVersionDetails}
          onViewAmortizacion={handleViewAmortizacionVersion} // ⬅️ NUEVO
        />
      )}

      {/* Reporte de resultados */}
      <ReportDisplay report={report} />

      {/* Modal de amortización */}
      <AmortizacionModal
        open={amortizacionModal.open}
        onClose={handleCloseAmortizacion}
        machineId={amortizacionModal.machineId}
        flujoHistorialId={amortizacionModal.flujoHistorialId}
      />
    </div>
  );
}
```

---

## 🎯 Flujo de Uso

### Escenario 1: Ver Amortización desde Máquina Seleccionada

```
Usuario selecciona máquina →
Click en "Ver Tabla de Amortización" →
Modal se abre →
POST /amortizacion/parametros { machineId } →
Frontend construye tabla de 36 meses →
Muestra tabla mensual + anual
```

### Escenario 2: Ver Amortización desde Versión Guardada

```
Usuario ve historial →
Click en icono 📊 en versión →
Modal se abre →
GET /amortizacion/reporte/:id →
Frontend construye tabla con valores exactos →
Muestra "Basado en análisis guardado #X"
```

---

## ✨ Características del Modal

1. **Dos Vistas**: Mensual (36 meses) y Anual (3 años)
2. **Exportación**: Botón para descargar CSV
3. **Metadata**: Muestra máquina, informe origen, fecha
4. **Fórmulas Excel**: Display de las fórmulas usadas
5. **Totales**: Suma automática de capital, interés, cuota
6. **Loading State**: Spinner mientras carga datos
7. **Error Handling**: Muestra errores claramente
8. **Sin Financiamiento**: Mensaje cuando no hay datos

---

## 🔧 Personalización

### Cambiar Estilos

El modal usa Tailwind CSS. Puedes personalizar:

```typescript
// Cambiar tamaño máximo
<DialogContent className="max-w-7xl max-h-[90vh]">

// Cambiar colores de fondo
<div className="bg-muted/50 rounded-lg p-4">

// Cambiar estilos de tabla
<table className="w-full text-sm">
```

### Agregar Columnas Adicionales

En `construirTablas()`:

```typescript
mensual.push({
  mes,
  cuota: params.cuotaMensual,
  capital: Number(capital.toFixed(2)),
  interes: Number(interes.toFixed(2)),
  saldo: mes === params.totalPeriodos ? 0 : Number(saldo.toFixed(2)),
  // ⬇️ NUEVA COLUMNA
  porcentajeCapital: Number(((capital / params.cuotaMensual) * 100).toFixed(2)),
});
```

---

## 🐛 Troubleshooting

### Error: "No se proporcionó machineId ni flujoHistorialId"

**Causa**: El modal se abrió sin pasar ninguno de los IDs.

**Solución**: Asegúrate de pasar `machineId` O `flujoHistorialId`:

```typescript
setAmortizacionModal({
  open: true,
  machineId: parseInt(machineId), // ✅ Uno de los dos
});
```

### Error: "No hay datos de financiamiento"

**Causa**: La máquina o reporte no tiene información de financiamiento.

**Solución**: Verifica que:

1. El informe de costo horario tenga `tasa_financiamiento_usada > 0`
2. El informe tenga `anios_financiamiento > 0`
3. La máquina tenga `valor_similar_nuevo > 0`

### Modal no se abre

**Causa**: El estado `open` no está cambiando.

**Solución**: Revisa que el handler esté conectado:

```typescript
// ✅ CORRECTO
<ParametersForm onViewAmortizacion={handleViewAmortizacion} />

// ❌ INCORRECTO
<ParametersForm onViewAmortizacion={undefined} />
```

---

## 📊 Estructura de Datos

### Response de `/amortizacion/parametros`

```typescript
{
  machine: {
    id: number;
    marca: string;
    modelo: string;
    estado: string;
  },
  informeOrigen: {
    id: number;
    fechaCalculo: string;
  },
  parametrosAmortizacion: {
    capital: number;
    tasaAnual: number;
    tasaMensual: number;
    mesesPorAnio: number;
    aniosFinanciamiento: number;
    totalPeriodos: number;
    cuotaMensual: number;
  },
  formulasExcel: {
    tea: string;
    cuotaMensual: string;
    interesMensual: string;
    capitalMensual: string;
  }
}
```

---

## 🚀 Próximos Pasos

1. Integrar el código en tu página principal
2. Probar con diferentes máquinas
3. Probar con versiones guardadas
4. Verificar exportación CSV
5. Personalizar estilos según tu diseño

---

**¡Listo para usar!** 🎉

Si tienes dudas, revisa los logs en consola:

- 🌐 "Obteniendo parámetros de amortización..."
- 📊 "Parámetros de amortización recibidos..."
- ❌ Errores se muestran en rojo
