# Datos Adicionales de Máquinas

Este documento describe cómo usar el campo `otros_json` para almacenar datos adicionales estructurados de las máquinas.

## Estructura de Datos Adicionales

El campo `otros_json` puede contener los siguientes datos adicionales:

### Campos Disponibles

| Campo                            | Tipo    | Descripción                            | Ejemplo          |
| -------------------------------- | ------- | -------------------------------------- | ---------------- |
| `procedencia_pais`               | string  | País de procedencia de la máquina      | "Estados Unidos" |
| `potencia_nominal_hp`            | string  | Potencia nominal en HP                 | "231 HP @ 2,000" |
| `consumo_combustible_lh`         | number  | Consumo de combustible L/h             | 15.5             |
| `equipos_comercializados_peru`   | number  | Equipos comercializados en Perú        | 150              |
| `plazo_entrega_dias`             | number  | Plazo de entrega del equipo (días)     | 45               |
| `capacitacion_horas`             | number  | Horas de capacitación                  | 40               |
| `tiempo_atencion_repuestos_dias` | number  | Tiempo de atención de repuestos (días) | 7                |
| `ofrece_financiamiento`          | boolean | Si ofrece financiamiento               | true             |

## Ejemplos de Uso

### Crear una máquina con datos adicionales

```json
POST /machines
{
  "modelo_id": 1,
  "estado": "activo",
  "valor_similar_nuevo": 250000,
  "vida_util": 18000,
  "otros_json": {
    "procedencia_pais": "Estados Unidos",
    "potencia_nominal_hp": "231 HP @ 2,000",
    "consumo_combustible_lh": 15.5,
    "equipos_comercializados_peru": 150,
    "plazo_entrega_dias": 45,
    "capacitacion_horas": 40,
    "ofrece_financiamiento": true
  }
}
```

### Actualizar datos adicionales de una máquina

```json
PATCH /machines/1
{
  "otros_json": {
    "procedencia_pais": "Japón",
    "potencia_nominal_hp": 180,
    "consumo_combustible_lh": 14.2,
    "ofrece_financiamiento": false
  }
}
```

### Ejemplo de respuesta

```json
{
  "id": 1,
  "modelo_id": 1,
  "id_equipo_interno": "CAR-CAT-950-001",
  "estado": "activo",
  "valor_similar_nuevo": 250000,
  "vida_util": 18000,
  "otros_json": {
    "procedencia_pais": "Estados Unidos",
    "potencia_nominal_hp": "231 HP @ 2,000",
    "consumo_combustible_lh": 15.5,
    "equipos_comercializados_peru": 150,
    "plazo_entrega_dias": 45,
    "capacitacion_horas": 40,
    "tiempo_atencion_repuestos_dias": 7,
    "ofrece_financiamiento": true
  },
  "modelo": {
    "id": 1,
    "nombre": "950H",
    "marca": {
      "nombre": "CAT"
    }
  }
}
```

## Validaciones

- Todos los campos son opcionales
- Los campos numéricos deben ser positivos
- `ofrece_financiamiento` debe ser boolean (true/false)

## Uso en Frontend

Puedes acceder a estos datos desde el frontend:

```typescript
interface DatosAdicionales {
  procedencia_pais?: string;
  potencia_nominal_hp?: string;
  consumo_combustible_lh?: number;
  // ... otros campos
}

// Uso
const machine = await getMachine(1);
const datosAdicionales: DatosAdicionales = machine.otros_json || {};

console.log(`Potencia: ${datosAdicionales.potencia_nominal_hp}`);
console.log(`Consumo: ${datosAdicionales.consumo_combustible_lh} L/h`);
```

## Aparición en Reportes de Conclusión

**¡IMPORTANTE!** Estos datos adicionales ahora se incluyen automáticamente en el **reporte final de análisis comparativo** (módulo de conclusión).

Cuando generes un análisis comparativo de máquinas, todos estos datos aparecerán en la tabla del reporte bajo la propiedad `datosAdicionales`:

```json
{
  "maquinas": [
    {
      "machineId": 4,
      "marca": "Caterpillar",
      "modelo": "320D",
      "valorPresenteNeto": 45000,
      "tasaInternaRetorno": 12.5,
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
    }
  ]
}
```

Esto te permite hacer comparaciones más completas incluyendo:

- ✅ Análisis financiero (VAN, TIR, etc.)
- ✅ Características técnicas (potencia, consumo)
- ✅ Información comercial (procedencia, financiamiento)
- ✅ Datos operacionales (tiempo de repuestos, capacitación)
