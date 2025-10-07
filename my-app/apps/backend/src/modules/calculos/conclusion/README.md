# Módulo de Análisis de Conclusión Comparativa

Este módulo permite realizar análisis comparativos de múltiples máquinas basándose en sus análisis de flujo de caja previos, generando reportes ejecutivos con métricas financieras, rankings y recomendaciones automáticas.

## Funcionalidades Principales

### 1. Análisis Comparativo de Máquinas

- **Endpoint**: `POST /calculos/conclusion/analizar`
- **Descripción**: Genera un análisis comparativo completo de múltiples máquinas
- **Input**: Array de máquinas con sus respectivos IDs de versión de flujo de caja
- **Output**: Reporte comparativo con métricas, rankings y recomendaciones

### 2. Métricas Financieras Extraídas

Para cada máquina se extraen las siguientes métricas del análisis de flujo de caja:

#### Datos Básicos

- Marca, Modelo, Equipo
- Vida Útil (horas)
- Valor de Adquisición ($)
- Valor Residual ($)

#### Métricas Financieras

- **Tarifa Horaria Interna** ($/h)
- **Tarifa Horaria Interna Equivalente** ($/h)
- **Valor Presente Neto** ($)
- **Anualidad Equivalente del VAN** ($/año)
- **Valor Presente Neto por Vida Útil** ($/h)
- **Valor Presente Neto por Dólar Invertido** (adimensional)
- **Tasa Interna de Retorno** (%)
- **Beneficio/Costo** (adimensional)
- **Retorno de la Inversión** (%)
- **Período de Recuperación** (años)

### 3. Resumen Estadístico Automático

El sistema calcula automáticamente:

- **Promedios, máximos y mínimos** de todas las métricas
- **Desviaciones estándar** para evaluar dispersión
- **Contadores** de máquinas con VAN positivo y TIR superior a tasa de descuento

### 4. Rankings Automáticos

Se generan rankings por:

- **Mejor VAN** (mayor a menor)
- **Mejor TIR** (mayor a menor)
- **Mejor Beneficio/Costo** (mayor a menor)
- **Menor Período de Recuperación** (menor a mayor)
- **Tarifa más Competitiva** (menor a mayor)

### 5. Recomendaciones Automáticas

El sistema identifica automáticamente:

- **Mejor opción por VAN**
- **Mejor opción por TIR**
- **Mejor Beneficio/Costo**
- **Menor período de recuperación**
- **Tarifa más competitiva**
- **Resumen ejecutivo** generado automáticamente
- **Advertencias** sobre máquinas con métricas problemáticas

## Estructura de Datos

### Input (CreateAnalisisConclusionDto)

```json
{
  "maquinas": [
    {
      "machineId": 4,
      "versionId": 12
    },
    {
      "machineId": 7,
      "versionId": 15
    }
  ],
  "lugarTrabajo": "Oficina Central",
  "comentario": "Análisis para proyecto minero",
  "usuarioId": "admin-uuid"
}
```

### Output (ConclusionResponse)

```json
{
  "analisisId": 123,
  "parametros": {
    "lugarTrabajo": "Oficina Central",
    "fechaAnalisis": "2025-10-02T...",
    "totalMaquinasAnalizadas": 2
  },
  "maquinas": [...],
  "resumen": {
    "vanPromedio": 150000,
    "vanMaximo": 200000,
    "vanMinimo": 100000,
    "tirPromedio": 15.5,
    "totalMaquinas": 2,
    "maquinasConVANPositivo": 2
  },
  "ranking": {
    "porVAN": [...],
    "porTIR": [...],
    "porBeneficioCosto": [...]
  },
  "recomendaciones": {
    "mejorVAN": {...},
    "mejorTIR": {...},
    "resumenEjecutivo": "Se analizaron 2 máquinas...",
    "advertencias": [...]
  },
  "estado": "calculado"
}
```

## Endpoints Disponibles

### 1. Generar Análisis Comparativo

```
POST /calculos/conclusion/analizar
Content-Type: application/json

{
  "maquinas": [
    { "machineId": 4, "versionId": 12 },
    { "machineId": 7, "versionId": 15 }
  ],
  "lugarTrabajo": "Oficina Central"
}
```

### 2. Calcular y Guardar

```
POST /calculos/conclusion/calcular-y-guardar
```

Genera el análisis y lo guarda en la base de datos (pendiente implementación de tabla).

### 3. Listar Todos los Análisis

```
GET /calculos/conclusion/todos
```

**Nota**: Funcionalidad pendiente - requiere crear tabla `analisis_conclusion`.

### 4. Obtener Análisis por ID

```
GET /calculos/conclusion/:id
```

**Nota**: Funcionalidad pendiente - requiere crear tabla `analisis_conclusion`.

## Dependencias

El módulo requiere:

- **FlujoCajaModule**: Para acceso a análisis de flujo de caja existentes
- **PrismaModule**: Para acceso a datos de máquinas
- Base de datos con las siguientes tablas:
  - `machines` (existente)
  - `analisis_flujo_caja` (existente)
  - `analisis_conclusion` (pendiente de crear)

## Validaciones

- **Máximo 20 máquinas** por análisis comparativo
- **Mínimo 1 máquina** requerida
- Validación que el `versionId` corresponda al `machineId` correcto
- Verificación de existencia de análisis de flujo de caja con resultados calculados

## Casos de Uso

1. **Comparación de Opciones de Inversión**: Comparar múltiples máquinas candidatas para decidir cuál adquirir
2. **Análisis de Flota**: Evaluar el desempeño financiero de máquinas existentes
3. **Reporte Ejecutivo**: Generar reportes automáticos con recomendaciones para la gerencia
4. **Benchmarking**: Comparar máquinas similares para identificar las más eficientes

## TODO - Funcionalidades Pendientes

1. **Crear tabla `analisis_conclusion`** en el esquema de Prisma
2. **Implementar guardado** en base de datos
3. **Implementar consultas** de análisis guardados
4. **Agregar exportación** a Excel/PDF
5. **Implementar filtros** por fecha, usuario, lugar de trabajo
6. **Agregar gráficos** y visualizaciones
7. **Notificaciones** automáticas cuando se completa un análisis
