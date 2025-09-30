# Extracción de Vida Útil del Fabricante

## Descripción

Se ha agregado la extracción del campo `vidaUtilFabricante` desde el informe de costo horario en el servicio de flujo de caja.

## Campo Agregado

- **Campo**: `vidaUtilFabricante`
- **Tipo**: `number`
- **Origen**: Campo `vida_util` de la tabla `machines`
- **Descripción**: Vida útil en horas especificada por el fabricante de la máquina

## Ubicación en el Código

### 1. Interfaz Actualizada

```typescript
// interfaces/flujo-caja-response.interface.ts
export interface DatosPrecargadosInforme {
  valorAdquisicion: number; // valor_similar_nuevo
  vidaUtilFabricante: number; // vida_util de la máquina  <-- NUEVO
  mesesAlAnio: number; // mes_por_anio del informe
  // ... resto de campos
}
```

### 2. Extracción en el Servicio

```typescript
// flujo-caja.service.ts - método preview()
const vidaUtilFabricante = Number(machine.vida_util) || 0;

// Se incluye en los datos precargados
const datosPrecargados: DatosPrecargadosInforme = {
  valorAdquisicion: Number(valorAdquisicion),
  vidaUtilFabricante: Number(vidaUtilFabricante), // <-- NUEVO
  mesesAlAnio: Number(mesesAlAnio),
  // ... resto de campos
};
```

### 3. Logging Agregado

```typescript
console.log(`[FLUJO-CAJA] Vida útil fabricante: ${vidaUtilFabricante} horas`);
```

## Ejemplo de Respuesta

```json
{
  "datosPrecargados": {
    "valorAdquisicion": 500000,
    "vidaUtilFabricante": 20000,  // <-- NUEVO CAMPO
    "mesesAlAnio": 12,
    "escenariosHoras": [...],
    "totalPosesionMantenimiento": 150000,
    "mantenimiento": {...},
    "primaSeguroTrec": 5000,
    "informeOrigen": {...}
  }
}
```

## Uso en Cálculos de Flujo de Caja

El campo `vidaUtilFabricante` puede ser utilizado para:

- Cálculos de depreciación
- Estimaciones de vida útil del equipo
- Análisis de rentabilidad a largo plazo
- Cálculos de valor residual

## Compatibilidad

- ✅ Compatible con el esquema de base de datos existente
- ✅ No afecta funcionalidad existente
- ✅ Se mantiene la estructura de respuesta actual
- ✅ Logging mejorado para debugging
