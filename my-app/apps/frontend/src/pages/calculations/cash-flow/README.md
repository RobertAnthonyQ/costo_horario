# Análisis de Flujo de Caja

Esta vista permite realizar análisis financiero de flujo de caja para evaluar la viabilidad de inversión en maquinaria.

## Estructura de Archivos

```
cash-flow/
├── index.tsx                    # Página principal
├── components/
│   ├── ParametersForm.tsx      # Formulario de parámetros
│   ├── ReportDisplay.tsx       # Visualización de resultados
│   └── index.ts                # Exportaciones
├── models/
│   └── types.ts                # Interfaces TypeScript
└── services/
    └── flujoCajaService.ts     # Servicio API
```

## Características

### 1. Selección de Máquina

- Lista de todas las máquinas disponibles
- Carga automática de versiones anteriores al seleccionar una máquina

### 2. Versiones Anteriores (Opcional)

- Muestra versiones previas de análisis para la máquina seleccionada
- Permite cargar parámetros de versiones anteriores
- Opción de ver detalles completos de cada versión

### 3. Parámetros del Cálculo

- **Porcentaje Residual**: Valor residual del activo (ej: 10%)
- **Margen Interno**: Margen de ganancia esperado (ej: 5%)
- **Gastos Generales Mantenimiento**: Gastos generales sobre mantenimiento (ej: 5%)
- **Horas Operativas/Mes**: Horas de operación estimadas por mes
- **Tasa de Descuento Empresa**: Tasa de descuento para el VAN (ej: 8%)
- **Comentario**: Descripción opcional del análisis

### 4. Acciones Disponibles

- **Calcular Preview**: Realiza el cálculo sin guardar en la base de datos
- **Calcular y Guardar**: Realiza el cálculo y guarda el resultado en la BD

## Endpoints del Backend

### Preview

```
POST /calculos/flujo-caja/preview
```

Calcula el análisis sin guardarlo.

### Guardar

```
POST /calculos/flujo-caja/guardar
```

Calcula y guarda el análisis en la base de datos.

### Obtener Versiones

```
GET /calculos/flujo-caja/versiones?machineId={id}
```

Obtiene todas las versiones de análisis para una máquina específica.

### Obtener por ID

```
GET /calculos/flujo-caja/{id}
```

Obtiene un análisis específico por su ID.

## Datos Precargados

El análisis utiliza datos del último **Informe de Costo Horario** de la máquina, incluyendo:

- Valor de adquisición
- Vida útil del fabricante
- Escenarios de horas de operación
- Datos de mantenimiento (preventivo, correctivo, neumáticos, etc.)
- Prima de seguro TREC
- Información del informe origen

## Resultados del Análisis

El reporte muestra:

- **VAN (Valor Actual Neto)**: Indicador de rentabilidad del proyecto
- **TIR (Tasa Interna de Retorno)**: Rentabilidad porcentual del proyecto
- **Valor Residual**: Valor estimado al final de la vida útil
- **Depreciación Anual**: Depreciación calculada por año
- **Años de Operación**: Vida útil operativa estimada

## Integración con el Sistema

### Ruta

- URL: `/cash-flow`
- Título: "Flujo de Caja"
- Icono: `DollarSign`
- Sección: "Cálculos Financieros" en el sidebar

### Dependencias

- `machinesService`: Para obtener la lista de máquinas
- `flujoCajaService`: Para todas las operaciones de flujo de caja
- Componentes UI de shadcn/ui

## Flujo de Trabajo Típico

1. Usuario selecciona una máquina
2. Sistema carga versiones anteriores (si existen)
3. Usuario puede cargar parámetros de una versión anterior o usar valores por defecto
4. Usuario ajusta los parámetros según necesidad
5. Usuario hace click en "Calcular Preview" para ver resultados sin guardar
6. Si está conforme, hace click en "Calcular y Guardar" para persistir el análisis
7. Sistema muestra el reporte completo en un modal
8. Versión se guarda y aparece en la lista de versiones disponibles

## Notas de Desarrollo

- Todos los porcentajes se manejan internamente como decimales (0.1 = 10%)
- La interfaz muestra los porcentajes en formato legible (10%)
- El servicio maneja automáticamente la conversión de BigInt a Number
- Los errores de red se manejan con mensajes descriptivos
- El estado de carga se indica visualmente en los botones
