# Cálculo de Tarifa Horaria y Margen Interno Equivalente

#### Comparación con Tarifa y Margen Actual

```typescript
const tarifaActual = 85.5; // $/h actual
const tarifaEquilibrio = 78.2; // $/h para VAN=0
const margenActual = 0.25; // 25% margen actual
const margenEquilibrio = 0.18; // 18% margen para VAN=0

const margenSeguridad = tarifaActual - tarifaEquilibrio; // $7.30/h
const porcentajeMargen = (margenSeguridad / tarifaEquilibrio) * 100; // 9.3%
const margenSeguridad = margenActual - margenEquilibrio; // 7 puntos porcentuales
```

## Relación entre Tarifa y Margen Equivalente

La **tarifa horaria equivalente** y el **margen interno equivalente** están directamente relacionados:

```
TarifaEquilibrio = TarifaOriginal × (MargenEquilibrio / MargenOriginal)
```

**Ejemplo práctico:**

````typescript
// Datos originales
const tarifaOriginal = 85.50;      // $/h
const margenOriginal = 0.25;       // 25%

// Datos de equilibrio (VAN = 0)
const tarifaEquilibrio = 78.20;    // $/h
const margenEquilibrio = 0.18;     // 18%

// Verificación de la relación
const factor = margenEquilibrio / margenOriginal; // 0.18 / 0.25 = 0.72
const tarifaCalculada = tarifaOriginal * factor;  // 85.50 × 0.72 = 61.56
```to

La **Tarifa Horaria Interna Equivalente** es la tarifa mínima que debe cobrar una máquina para que el **VAN sea exactamente 0** (punto de equilibrio).

El **Margen Interno Equivalente** es el margen de utilidad que corresponde a esa tarifa de equilibrio.

Estos cálculos son cruciales para:

- ✅ Determinar la **viabilidad mínima** del proyecto
- ✅ Establecer **precios competitivos** pero rentables
- ✅ Conocer el **límite inferior** de cotización
- ✅ Evaluar **márgenes de seguridad** en la tarifa actual

## Fórmula y Metodología

### Método de Bisección

El sistema utiliza el **método de bisección** para encontrar la tarifa que hace VAN = 0:

````

VAN = -Inversión_Inicial + Σ(Flujos_Netos_Anuales / (1 + r)^n) + Valor_Residual_Descontado

Donde:

- Flujos_Netos_Anuales = (Tarifa × Horas_Anuales) - Costos_Operativos_Anuales
- r = Tasa de descuento
- n = Año del flujo

````

### Algoritmo de Cálculo

1. **Inicialización**:
   - Tarifa mínima = $0/h
   - Tarifa máxima = $1,000/h (límite razonable)

2. **Iteración**:
   - Probar tarifa = (mínima + máxima) / 2
   - Calcular VAN con esa tarifa
   - Si VAN < 0: subir tarifa mínima
   - Si VAN > 0: bajar tarifa máxima
   - Repetir hasta precisión de $0.01

3. **Convergencia**: Máximo 100 iteraciones o precisión alcanzada

## Parámetros Necesarios

### Desde el Análisis de Flujo de Caja:

- `valorAdquisicion` - Inversión inicial
- `valorResidual` - Valor de salvamento
- `tasa_descuento_empresa` - Tasa de descuento (WACC)
- `aniosOperacionEstimados` - Período de operación **_(DINÁMICO: usa años reales del análisis)_**

### Desde la Máquina:

- `vida_util` - Vida útil en horas
- Costos operativos anuales (mantenimiento, combustible, etc.)

## Interpretación de Resultados

### Comparación con Tarifa Actual

```typescript
const tarifaActual = 85.5; // $/h actual
const tarifaEquilibrio = 78.2; // $/h para VAN=0
const margenSeguridad = tarifaActual - tarifaEquilibrio; // $7.30/h
const porcentajeMargen = (margenSeguridad / tarifaEquilibrio) * 100; // 9.3%
````

### Escenarios de Interpretación:

#### ✅ Tarifa Actual > Tarifa Equilibrio

```
Tarifa Actual: $85.50/h
Tarifa Equilibrio: $78.20/h
Margen: +$7.30/h (9.3%)
```

**Interpretación**: Proyecto rentable con margen de seguridad

#### ⚠️ Tarifa Actual ≈ Tarifa Equilibrio

```
Tarifa Actual: $78.50/h
Tarifa Equilibrio: $78.20/h
Margen: +$0.30/h (0.4%)
```

**Interpretación**: Proyecto en punto de equilibrio, riesgo alto

#### ❌ Tarifa Actual < Tarifa Equilibrio

```
Tarifa Actual: $75.00/h
Tarifa Equilibrio: $78.20/h
Déficit: -$3.20/h (-4.1%)
```

**Interpretación**: Proyecto no rentable, requiere ajuste

## Casos de Uso Prácticos

### 1. Cotización de Proyectos

```bash
# Conocer tarifa mínima antes de cotizar
curl -X POST /calculos/conclusion/analizar \
  -d '{"maquinas": [{"machineId": 4, "versionId": 12}], "lugarTrabajo": "Proyecto ABC"}'

# Respuesta incluye:
# "tarifaHorariaInterna": 85.50,        # Tarifa calculada actual
# "tarifaHorariaInternaEquivalente": 78.20  # Tarifa mínima viable
```

### 2. Análisis de Competitividad

```typescript
const analisisCompetitividad = {
  tarifaMercado: 80.0, // $/h precio de mercado
  tarifaEquilibrio: 78.2, // $/h mínima viable
  tarifaOptima: 85.5, // $/h calculada actual

  // Escenarios posibles:
  puedeComperir: tarifaMercado > tarifaEquilibrio, // true
  margenMercado: tarifaMercado - tarifaEquilibrio, // $1.80/h
  sacrificioMargen: tarifaOptima - tarifaMercado, // $5.50/h
};
```

### 3. Optimización de Flotas

```typescript
// Comparar múltiples máquinas
const maquinas = [
  { modelo: 'CAT 320D', tarifaEquilibrio: 78.2, tarifaActual: 85.5 },
  { modelo: 'Komatsu PC200', tarifaEquilibrio: 75.8, tarifaActual: 82.2 },
  { modelo: 'Volvo EC220', tarifaEquilibrio: 79.5, tarifaActual: 84.0 },
];

// La Komatsu tiene la tarifa de equilibrio más baja = más competitiva
```

## Factores que Afectan el Cálculo

### Reducen la Tarifa de Equilibrio (Mejor):

- ✅ **Mayor vida útil** - Más horas para amortizar inversión
- ✅ **Menor costo operativo** - Combustible, mantenimiento eficiente
- ✅ **Mayor valor residual** - Mejor reventa al final
- ✅ **Menor inversión inicial** - Máquinas más económicas
- ✅ **Mayor tasa de descuento** - Valorar más el presente

### Aumentan la Tarifa de Equilibrio (Peor):

- ❌ **Menor vida útil** - Menos tiempo para recuperar inversión
- ❌ **Mayor costo operativo** - Mantenimiento costoso, alto consumo
- ❌ **Menor valor residual** - Depreciación acelerada
- ❌ **Mayor inversión inicial** - Máquinas más caras
- ❌ **Menor tasa de descuento** - Mayor exigencia de rentabilidad

## Logging y Debugging

El sistema registra información detallada del cálculo:

```
[CONCLUSION] Calculando tarifa de equilibrio...
[CONCLUSION] - Valor adquisición: $250,000
[CONCLUSION] - Valor residual: $25,000
[CONCLUSION] - Tasa descuento: 7.00%
[CONCLUSION] - Años operación: 5
[CONCLUSION] - Horas anuales: 2,400
[CONCLUSION] ✅ Tarifa de equilibrio encontrada: $78.20/h en 15 iteraciones
```

Esta información permite verificar que los parámetros son correctos y el cálculo converge apropiadamente.
