# Módulo de Análisis de Flujo de Caja

Este módulo permite realizar análisis de flujo de caja para máquinas, precargando automáticamente los datos desde el informe de costo horario más reciente.

## Características Principales

✅ **Cálculo automático** - Preview hace todo automáticamente  
✅ **Extracción de campos requeridos**: escenarios_horas, valor adquisición, meses al año, totales mantenimiento  
✅ **Desglose completo de mantenimiento**: Preventivo, Correctivo, Neumáticos, Elementos desgaste, Soldadura, Mano Obra  
✅ **Prima/Seguro TREC** desde sección 3 del informe  
✅ **Endpoints simplificados** y directos  
✅ **Validación de datos** y manejo de errores

## Endpoints Disponibles

### 1. Preview (Cálculo Automático) ⚡

`POST /calculos/flujo-caja/preview`

**Hace todo automáticamente**: Precarga datos del informe de costo horario + realiza cálculo.

**Request Body:**

```json
{
  "machineId": 4,
  "informeCostoHorarioId": 123, // opcional, usa el más reciente
  "porcentajeResidual": 0.1, // opcional, 10% por defecto
  "margenInterno": 0.05, // opcional, 5% por defecto
  "gastosGeneralesMantenimiento": 25000.5, // opcional
  "horasOperativasMes": 300, // opcional
  "tasaDescuentoEmpresa": 0.08, // opcional, 8% por defecto
  "usuarioId": "user-uuid", // opcional
  "comentario": "Análisis CAT 950" // opcional
}
```

**Response:**

```json
{
  "machine": {
    "id": 4,
    "marca": "Caterpillar",
    "modelo": "950H",
    "estado": "Usado"
  },
  "datosPrecargados": {
    "valorAdquisicion": 279000,
    "mesesAlAnio": 12,
    "escenariosHoras": [...],
    "mantenimiento": {
      "preventivo": 2.23,
      "correctivo": 44.784,
      "neumaticos": 5.20,
      "elementosDesgaste": 4.00,
      "soldadura": 0.90,
      "manoDeObraSupervision": 2.39
    },
    "primaSeguroTrec": 0.78
  },
  "parametros": {
    "porcentajeResidual": 0.10,
    "margenInterno": 0.05,
    "gastosGeneralesMantenimiento": 47.97,
    "horasOperativasMes": 300,
    "tasaDescuentoEmpresa": 0.08
  },
  "estado": "calculado",
  "resultadoFlujo": {
    "calculoCompleto": true,
    "fechaCalculo": "2025-09-29T15:00:00Z"
  }
}
```

### 2. Extraer Escenarios 📊

`POST /calculos/flujo-caja/extraer-escenarios`

Extrae únicamente los escenarios de horas del último informe de costo horario.

**Request Body:**

```json
{
  "machineId": 4
}
```

**Response:**

```json
{
  "machine": {
    "id": 4,
    "marca": "Caterpillar",
    "modelo": "950H"
  },
  "informeOrigen": {
    "id": 123,
    "fechaCalculo": "2025-09-29T10:30:00Z"
  },
  "escenarios": [
    {
      "escenarioId": 1,
      "horasMinimas": 300,
      "gradoOperatividad": 0.8,
      "factorMercado": 0.55,
      "horasUsoAnual": 3600,
      "mesesAlAnio": 12
    }
  ],
  "totalEscenarios": 1,
  "extractedAt": "2025-09-29T15:00:00Z"
}
```

### 3. Guardar 💾

`POST /calculos/flujo-caja/guardar`

Calcula y guarda automáticamente el análisis en la base de datos.

**Request Body:** (Igual que preview)
**Response:** Registro guardado en BD

### 4. Obtener Todos 📋

`GET /calculos/flujo-caja/todos`

Lista todos los análisis realizados, con detalles completos.

**Response:**

```json
[
  {
    "id": 1,
    "machine_id": 4,
    "fecha_calculo": "2025-09-29T15:00:00Z",
    "porcentaje_residual": 0.10,
    "resultado_flujo_json": {...},
    "machines": {
      "modelos": {
        "nombre": "950H",
        "marcas": { "nombre": "Caterpillar" }
      }
    }
  }
]
```

### 4. Obtener por ID 🎯

`GET /calculos/flujo-caja/{id}`

Obtiene un análisis específico con todos los detalles.

### 5. Obtener Versiones 📋

`GET /calculos/flujo-caja/versiones`

Lista solo nombres y fechas para selección rápida.

**Response:**

```json
[
  {
    "id": 1,
    "nombre": "Análisis CAT 950",
    "fechaCalculo": "2025-09-29T15:00:00Z",
    "machine": {
      "id": 4,
      "marca": "Caterpillar",
      "modelo": "950H"
    }
  }
]
```

## Campos Precargados Automáticamente

### 📊 **Información Básica**

- ✅ **Valor de Adquisición**: `valor_similar_nuevo` de la máquina
- ✅ **Meses al Año**: `mes_por_anio` del informe

### ⏱️ **Escenarios de Horas**

- ✅ **Horas Mínimas**: Del informe de posesión
- ✅ **Grado Operatividad**: Factor de operatividad
- ✅ **Factor Mercado**: Factor de mercado
- ✅ **Horas Uso Anual**: Calculado automáticamente

### 🔧 **Desglose de Mantenimiento** (Sección 4)

- ✅ **Preventivo**: Lubricantes + Filtros + Materiales Ferretería
- ✅ **Correctivo**: Materiales Eléctricos + Mangueras + Menores + Mayores
- ✅ **Neumáticos**: Costo mantenimiento neumáticos
- ✅ **Elementos de Desgaste**: Gets/elementos de desgaste
- ✅ **Soldadura**: Estructural/soldadura
- ✅ **Mano de Obra / Supervisión**: Mano de obra técnico

### 🛡️ **Prima/Seguro**

- ✅ **Prima/Seguro TREC**: Desde sección 3 del informe

## Flujo de Uso Simplificado

```typescript
// 1. Preview - Hace todo automático
const resultado = await fetch('/calculos/flujo-caja/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ machineId: 4 }),
});

const analisis = await resultado.json();

// 2. Todos los datos están listos:
console.log('Valor Adquisición:', analisis.datosPrecargados.valorAdquisicion);
console.log('Preventivo:', analisis.datosPrecargados.mantenimiento.preventivo);
console.log('Correctivo:', analisis.datosPrecargados.mantenimiento.correctivo);
console.log('Neumáticos:', analisis.datosPrecargados.mantenimiento.neumaticos);
console.log(
  'Elementos Desgaste:',
  analisis.datosPrecargados.mantenimiento.elementosDesgaste,
);
console.log('Soldadura:', analisis.datosPrecargados.mantenimiento.soldadura);
console.log(
  'Mano Obra:',
  analisis.datosPrecargados.mantenimiento.manoDeObraSupervision,
);
console.log('Prima TREC:', analisis.datosPrecargados.primaSeguroTrec);

// 3. Si quieres guardarlo:
await fetch('/calculos/flujo-caja/guardar', {
  method: 'POST',
  body: JSON.stringify({ machineId: 4 }),
});
```

## Requisitos Previos

- La máquina debe tener al menos **un informe de costo horario** previo
- El informe debe tener **escenarios de horas** válidos
- Los **ratios y componentes** deben estar configurados en el modelo

## Manejo de Errores

- **404**: Máquina no encontrada o sin informe de costo horario previo
- **400**: Datos inválidos en el request
- **500**: Error interno del servidor
