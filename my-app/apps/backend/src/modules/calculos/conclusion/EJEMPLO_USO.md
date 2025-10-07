# Ejemplo de Uso del Módulo de Conclusión

## Datos de Ejemplo para Testing

### Ejemplo 1: Análisis Comparativo de 3 Excavadoras

```json
{
  "maquinas": [
    {
      "machineId": 4,
      "versionId": 12,
      "comentario": "Excavadora CAT 320 - Análisis del 15/09/2025"
    },
    {
      "machineId": 7,
      "versionId": 15,
      "comentario": "Excavadora Komatsu PC200 - Análisis del 18/09/2025"
    },
    {
      "machineId": 9,
      "versionId": 18,
      "comentario": "Excavadora Volvo EC220 - Análisis del 20/09/2025"
    }
  ],
  "lugarTrabajo": "Mina El Dorado - Sector Norte",
  "comentario": "Análisis comparativo para selección de excavadora principal para el proyecto de expansión Q4 2025",
  "usuarioId": "admin-12345"
}
```

### Ejemplo 2: Comparación de Cargadores Frontales

```json
{
  "maquinas": [
    {
      "machineId": 15,
      "versionId": 23
    },
    {
      "machineId": 18,
      "versionId": 27
    }
  ],
  "lugarTrabajo": "Cantera San Miguel",
  "comentario": "Evaluación de cargadores frontales para operación de cantera"
}
```

## Comandos cURL de Ejemplo

### 1. Generar Análisis Comparativo

```bash
curl -X POST http://localhost:3000/calculos/conclusion/analizar \
  -H "Content-Type: application/json" \
  -d '{
    "maquinas": [
      {"machineId": 4, "versionId": 12},
      {"machineId": 7, "versionId": 15},
      {"machineId": 9, "versionId": 18}
    ],
    "lugarTrabajo": "Mina El Dorado - Sector Norte",
    "comentario": "Análisis comparativo Q4 2025"
  }'
```

### 2. Calcular y Guardar

```bash
curl -X POST http://localhost:3000/calculos/conclusion/calcular-y-guardar \
  -H "Content-Type: application/json" \
  -d '{
    "maquinas": [
      {"machineId": 4, "versionId": 12},
      {"machineId": 7, "versionId": 15}
    ],
    "lugarTrabajo": "Oficina Central"
  }'
```

### 3. Obtener Todos los Análisis

```bash
curl -X GET http://localhost:3000/calculos/conclusion/todos
```

### 4. Obtener Análisis por ID

```bash
curl -X GET http://localhost:3000/calculos/conclusion/123
```

## Respuesta Esperada (Ejemplo)

```json
{
  "analisisId": 1698765432,
  "parametros": {
    "lugarTrabajo": "Mina El Dorado - Sector Norte",
    "fechaAnalisis": "2025-10-02T15:30:00.000Z",
    "comentario": "Análisis comparativo Q4 2025",
    "usuarioId": "admin-12345",
    "totalMaquinasAnalizadas": 3
  },
  "maquinas": [
    {
      "machineId": 4,
      "versionFlujoCajaId": 12,
      "marca": "Caterpillar",
      "modelo": "320D",
      "equipo": "Excavadora",
      "vidaUtil": 12000,
      "valorAdquisicion": 250000,
      "valorResidual": 25000,
      "tarifaHorariaInterna": 85.5,
      "tarifaHorariaInternaEquivalente": 78.2,
      "margenInternoEquivalente": 0.18,
      "valorPresenteNeto": 45000,
      "anualidadEquivalenteVAN": 8500,
      "valorPresenteNetoPorVidaUtil": 3.75,
      "valorPresenteNetoPorDolarInvertido": 0.18,
      "tasaInternaRetorno": 12.5,
      "beneficioCosto": 1.18,
      "retornoInversion": 18.0,
      "periodoRecuperacion": 5.5,
      "fechaAnalisisFlujoCaja": "2025-09-15T10:00:00.000Z",
      "datosAdicionales": {
        "procedencia_pais": "Estados Unidos",
        "potencia_nominal_hp": "231 HP @ 2,000",
        "consumo_combustible_lh": 15.5,
        "equipos_comercializados_peru": 150,
        "plazo_entrega_dias": 45,
        "capacitacion_horas": 40,
        "tiempo_atencion_repuestos_dias": "3-5",
        "ofrece_financiamiento": true
      }
    },
    {
      "machineId": 7,
      "versionFlujoCajaId": 15,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "equipo": "Excavadora",
      "vidaUtil": 11000,
      "valorAdquisicion": 230000,
      "valorResidual": 23000,
      "tarifaHorariaInterna": 82.2,
      "tarifaHorariaInternaEquivalente": 75.8,
      "margenInternoEquivalente": 0.16,
      "valorPresenteNeto": 52000,
      "anualidadEquivalenteVAN": 9800,
      "valorPresenteNetoPorVidaUtil": 4.73,
      "valorPresenteNetoPorDolarInvertido": 0.23,
      "tasaInternaRetorno": 14.2,
      "beneficioCosto": 1.23,
      "retornoInversion": 22.6,
      "periodoRecuperacion": 4.8,
      "fechaAnalisisFlujoCaja": "2025-09-18T14:30:00.000Z",
      "datosAdicionales": {
        "procedencia_pais": "Japón",
        "potencia_nominal_hp": "190 HP @ 1,850",
        "consumo_combustible_lh": 14.2,
        "equipos_comercializados_peru": 120,
        "plazo_entrega_dias": 60,
        "capacitacion_horas": 35,
        "tiempo_atencion_repuestos_dias": "5-7",
        "ofrece_financiamiento": false
      }
    }
  ],
  "resumen": {
    "vanPromedio": 48500,
    "vanMaximo": 52000,
    "vanMinimo": 45000,
    "vanDesviacionEstandar": 4950,
    "tirPromedio": 13.35,
    "tirMaximo": 14.2,
    "tirMinimo": 12.5,
    "tirDesviacionEstandar": 1.2,
    "tarifaPromedio": 83.85,
    "tarifaMaxima": 85.5,
    "tarifaMinima": 82.2,
    "tarifaDesviacionEstandar": 2.33,
    "beneficioCostoPromedio": 1.205,
    "beneficioCostoMaximo": 1.23,
    "beneficioCostoMinimo": 1.18,
    "periodoRecuperacionPromedio": 5.15,
    "periodoRecuperacionMaximo": 5.5,
    "periodoRecuperacionMinimo": 4.8,
    "totalMaquinas": 2,
    "maquinasConVANPositivo": 2,
    "maquinasConTIRSuperiorTasaDescuento": 2
  },
  "ranking": {
    "porVAN": [
      {
        "machineId": 7,
        "marca": "Komatsu",
        "modelo": "PC200-8",
        "valorPresenteNeto": 52000
      },
      {
        "machineId": 4,
        "marca": "Caterpillar",
        "modelo": "320D",
        "valorPresenteNeto": 45000
      }
    ],
    "porTIR": [
      {
        "machineId": 7,
        "marca": "Komatsu",
        "modelo": "PC200-8",
        "tasaInternaRetorno": 14.2
      },
      {
        "machineId": 4,
        "marca": "Caterpillar",
        "modelo": "320D",
        "tasaInternaRetorno": 12.5
      }
    ],
    "porBeneficioCosto": [
      {
        "machineId": 7,
        "marca": "Komatsu",
        "modelo": "PC200-8",
        "beneficioCosto": 1.23
      },
      {
        "machineId": 4,
        "marca": "Caterpillar",
        "modelo": "320D",
        "beneficioCosto": 1.18
      }
    ],
    "porPeriodoRecuperacion": [
      {
        "machineId": 7,
        "marca": "Komatsu",
        "modelo": "PC200-8",
        "periodoRecuperacion": 4.8
      },
      {
        "machineId": 4,
        "marca": "Caterpillar",
        "modelo": "320D",
        "periodoRecuperacion": 5.5
      }
    ],
    "porTarifaHoraria": [
      {
        "machineId": 7,
        "marca": "Komatsu",
        "modelo": "PC200-8",
        "tarifaHorariaInterna": 82.2
      },
      {
        "machineId": 4,
        "marca": "Caterpillar",
        "modelo": "320D",
        "tarifaHorariaInterna": 85.5
      }
    ]
  },
  "recomendaciones": {
    "mejorVAN": {
      "machineId": 7,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "valorPresenteNeto": 52000
    },
    "mejorTIR": {
      "machineId": 7,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "tasaInternaRetorno": 14.2
    },
    "mejorBeneficioCosto": {
      "machineId": 7,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "beneficioCosto": 1.23
    },
    "menorPeriodoRecuperacion": {
      "machineId": 7,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "periodoRecuperacion": 4.8
    },
    "tarifaMasCompetitiva": {
      "machineId": 7,
      "marca": "Komatsu",
      "modelo": "PC200-8",
      "tarifaHorariaInterna": 82.2
    },
    "resumenEjecutivo": "Se analizaron 2 máquinas para determinar la mejor opción de inversión. La máquina con mejor Valor Presente Neto es la Komatsu PC200-8 con un VAN de $52,000. La máquina con mejor Tasa Interna de Retorno es la Komatsu PC200-8 con un TIR de 14.20%. El VAN promedio de todas las máquinas es $48,500 con una TIR promedio de 13.35%.",
    "advertencias": []
  },
  "estado": "calculado"
}
```

## Casos de Error Comunes

### 1. Máquina no encontrada

```json
{
  "statusCode": 404,
  "message": "Máquina con ID 999 no encontrada"
}
```

### 2. Análisis de flujo de caja no encontrado

```json
{
  "statusCode": 404,
  "message": "Análisis de flujo de caja con ID 999 no encontrado"
}
```

### 3. Máquina no corresponde a la versión

```json
{
  "statusCode": 400,
  "message": "El análisis de flujo de caja ID 15 no corresponde a la máquina ID 4"
}
```

### 4. Sin resultados calculados

```json
{
  "statusCode": 400,
  "message": "El análisis de flujo de caja ID 12 no tiene resultados calculados"
}
```

### 5. Demasiadas máquinas

```json
{
  "statusCode": 400,
  "message": "Máximo 20 máquinas permitidas por análisis comparativo"
}
```
