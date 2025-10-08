# 📊 Endpoints de Tabla de Amortización

## Implementación Completa - Backend

Este documento explica cómo usar los 2 nuevos endpoints de amortización implementados.

---

## 🎯 **ENDPOINT 1: Crear Nueva Tabla de Amortización**

### **Descripción**

Obtiene los parámetros clave del **último informe de costo horario** de una máquina para que el frontend construya la tabla de amortización completa (mensual y anual).

### **Request**

```http
POST /api/calculos/flujo-caja/amortizacion/parametros
Content-Type: application/json

{
  "machineId": 4
}
```

### **Response Exitoso (200 OK)**

```json
{
  "machine": {
    "id": 4,
    "marca": "CAT",
    "modelo": "950",
    "estado": "Disponible",
    "idEquipo": "EQ-950-001"
  },
  "informeOrigen": {
    "id": 15,
    "fechaCalculo": "2025-01-15T10:30:00Z"
  },
  "parametrosAmortizacion": {
    "capital": 279000,
    "tasaAnual": 0.0699,
    "tasaMensual": 0.00565,
    "mesesPorAnio": 12,
    "aniosFinanciamiento": 3,
    "totalPeriodos": 36,
    "cuotaMensual": 8586.11
  },
  "formulasExcel": {
    "tea": "=POTENCIA(1 + tasaAnual, 1/mesesPorAnio) - 1",
    "cuotaMensual": "=(capital * tea) / (1 - POTENCIA(1 + tea, -totalPeriodos))",
    "interesMensual": "=saldoPendiente * tea",
    "capitalMensual": "=cuotaMensual - interesMensual"
  }
}
```

### **Response Sin Financiamiento (200 OK)**

```json
{
  "machine": {
    "id": 4,
    "marca": "CAT",
    "modelo": "950",
    "estado": "Disponible"
  },
  "informeOrigen": {
    "id": 15,
    "fechaCalculo": "2025-01-15T10:30:00Z"
  },
  "sinFinanciamiento": true,
  "mensaje": "No hay datos de financiamiento para esta máquina",
  "parametrosAmortizacion": null
}
```

### **Response Error (404 Not Found)**

```json
{
  "statusCode": 404,
  "message": "Máquina con ID 4 no encontrada"
}
```

---

## 🎯 **ENDPOINT 2: Obtener Tabla de Reporte Guardado**

### **Descripción**

Obtiene los parámetros **EXACTOS** que se usaron en un análisis de flujo de caja guardado específico. Útil para reproducir exactamente la tabla de amortización de un reporte pasado.

### **Request**

```http
GET /api/calculos/flujo-caja/amortizacion/reporte/23
```

### **Response Exitoso (200 OK)**

```json
{
  "flujoHistorial": {
    "id": 23,
    "fechaCalculo": "2025-02-10T14:20:00Z",
    "machine": {
      "id": 4,
      "marca": "CAT",
      "modelo": "950",
      "estado": "Disponible"
    }
  },
  "informeOrigenUsado": {
    "id": 15,
    "fechaCalculo": "2025-01-15T10:30:00Z"
  },
  "parametrosAmortizacion": {
    "capital": 279000,
    "tasaAnual": 0.0699,
    "tasaMensual": 0.00565,
    "mesesPorAnio": 12,
    "aniosFinanciamiento": 3,
    "totalPeriodos": 36,
    "cuotaMensual": 8586.11
  },
  "formulasExcel": {
    "tea": "=POTENCIA(1 + tasaAnual, 1/mesesPorAnio) - 1",
    "cuotaMensual": "=(capital * tea) / (1 - POTENCIA(1 + tea, -totalPeriodos))",
    "interesMensual": "=saldoPendiente * tea",
    "capitalMensual": "=cuotaMensual - interesMensual"
  },
  "nota": "Estos son los parámetros EXACTOS usados en el análisis guardado"
}
```

### **Response Sin Financiamiento (200 OK)**

```json
{
  "flujoHistorial": {
    "id": 23,
    "fechaCalculo": "2025-02-10T14:20:00Z",
    "machine": {
      "id": 4,
      "marca": "CAT",
      "modelo": "950"
    }
  },
  "sinFinanciamiento": true,
  "mensaje": "Este análisis no incluía financiamiento",
  "parametrosAmortizacion": null
}
```

### **Response Error (404 Not Found)**

```json
{
  "statusCode": 404,
  "message": "Análisis de flujo con ID 23 no encontrado"
}
```

---

## 💻 **CÓDIGO FRONTEND - Construcción de Tabla**

### **Ejemplo en TypeScript/JavaScript**

```typescript
// 1. Llamar al endpoint
const response = await fetch(
  '/api/calculos/flujo-caja/amortizacion/parametros',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId: 4 }),
  },
);

const data = await response.json();

// 2. Validar que hay financiamiento
if (data.sinFinanciamiento) {
  console.log(data.mensaje);
  return;
}

const { parametrosAmortizacion } = data;

// 3. Construir tabla mensual (36 meses)
const tablaMensual = [];
let saldo = parametrosAmortizacion.capital;

for (let mes = 1; mes <= parametrosAmortizacion.totalPeriodos; mes++) {
  // Calcular interés del mes
  const interes = saldo * parametrosAmortizacion.tasaMensual;

  // Calcular capital del mes
  const capital = parametrosAmortizacion.cuotaMensual - interes;

  // Actualizar saldo
  saldo -= capital;

  // Agregar fila a la tabla
  tablaMensual.push({
    mes,
    cuota: parametrosAmortizacion.cuotaMensual,
    capital: Number(capital.toFixed(2)),
    interes: Number(interes.toFixed(2)),
    saldo:
      mes === parametrosAmortizacion.totalPeriodos
        ? 0
        : Number(saldo.toFixed(2)),
  });
}

// 4. Construir tabla anual (3 años)
const tablaAnual = [];
for (let anio = 1; anio <= parametrosAmortizacion.aniosFinanciamiento; anio++) {
  const inicio = (anio - 1) * parametrosAmortizacion.mesesPorAnio;
  const fin = anio * parametrosAmortizacion.mesesPorAnio;
  const mesesDelAnio = tablaMensual.slice(inicio, fin);

  tablaAnual.push({
    anio,
    capital: mesesDelAnio.reduce((sum, m) => sum + m.capital, 0),
    interes: mesesDelAnio.reduce((sum, m) => sum + m.interes, 0),
    total: mesesDelAnio.reduce((sum, m) => sum + m.cuota, 0),
    saldo: mesesDelAnio[mesesDelAnio.length - 1].saldo,
  });
}

console.log('Tabla Mensual:', tablaMensual);
console.log('Tabla Anual:', tablaAnual);
```

### **Ejemplo en React Component**

```typescript
import React, { useState, useEffect } from 'react';

interface AmortizacionParams {
  capital: number;
  tasaAnual: number;
  tasaMensual: number;
  mesesPorAnio: number;
  aniosFinanciamiento: number;
  totalPeriodos: number;
  cuotaMensual: number;
}

interface FilaMensual {
  mes: number;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

const TablaAmortizacion: React.FC<{ machineId: number }> = ({ machineId }) => {
  const [parametros, setParametros] = useState<AmortizacionParams | null>(null);
  const [tablaMensual, setTablaMensual] = useState<FilaMensual[]>([]);

  useEffect(() => {
    const fetchParametros = async () => {
      const response = await fetch('/api/calculos/flujo-caja/amortizacion/parametros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId })
      });

      const data = await response.json();

      if (!data.sinFinanciamiento) {
        setParametros(data.parametrosAmortizacion);
        construirTabla(data.parametrosAmortizacion);
      }
    };

    fetchParametros();
  }, [machineId]);

  const construirTabla = (params: AmortizacionParams) => {
    const tabla: FilaMensual[] = [];
    let saldo = params.capital;

    for (let mes = 1; mes <= params.totalPeriodos; mes++) {
      const interes = saldo * params.tasaMensual;
      const capital = params.cuotaMensual - interes;
      saldo -= capital;

      tabla.push({
        mes,
        cuota: params.cuotaMensual,
        capital: Number(capital.toFixed(2)),
        interes: Number(interes.toFixed(2)),
        saldo: mes === params.totalPeriodos ? 0 : Number(saldo.toFixed(2))
      });
    }

    setTablaMensual(tabla);
  };

  if (!parametros) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Tabla de Amortización</h2>
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Cuota</th>
            <th>Capital</th>
            <th>Interés</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {tablaMensual.map(fila => (
            <tr key={fila.mes}>
              <td>{fila.mes}</td>
              <td>${fila.cuota.toLocaleString()}</td>
              <td>${fila.capital.toLocaleString()}</td>
              <td>${fila.interes.toLocaleString()}</td>
              <td>${fila.saldo.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaAmortizacion;
```

---

## 📋 **MAPEO DE DATOS**

### **Origen de los Parámetros**

| Parámetro             | Origen (DB)                                       | Descripción                      |
| --------------------- | ------------------------------------------------- | -------------------------------- |
| `capital`             | `machines.valor_similar_nuevo`                    | Préstamo inicial                 |
| `tasaAnual`           | `informe_costo_horario.tasa_financiamiento_usada` | CAT FINANCIAMIENTO (ej: 6.99%)   |
| `aniosFinanciamiento` | `informe_costo_horario.anios_financiamiento`      | Plazo del préstamo (ej: 3 años)  |
| `mesesPorAnio`        | `informe_costo_horario.mes_por_anio`              | Meses por año (12)               |
| `tasaMensual`         | **Calculado**                                     | TEA = (1 + tasaAnual)^(1/12) - 1 |
| `cuotaMensual`        | **Calculado**                                     | Fórmula francesa                 |

### **Fórmulas Utilizadas**

```javascript
// TEA (Tasa Efectiva Mensual)
tea = Math.pow(1 + tasaAnual, 1 / mesesPorAnio) - 1;

// Cuota Mensual (Fórmula Francesa)
totalPeriodos = mesesPorAnio * aniosFinanciamiento;
denominador = 1 - Math.pow(1 + tea, -totalPeriodos);
cuotaMensual = (capital * tea) / denominador;

// Por cada mes:
interesMes = saldoPendiente * tea;
capitalMes = cuotaMensual - interesMes;
nuevoSaldo = saldoPendiente - capitalMes;
```

---

## 🔄 **FLUJO COMPLETO**

### **Escenario 1: Nueva Tabla**

```
Usuario selecciona Máquina ID=4
   ↓
POST /amortizacion/parametros { machineId: 4 }
   ↓
Backend busca último informe_costo_horario
   ↓
Backend extrae capital, tasa, años
   ↓
Backend calcula TEA y cuota mensual
   ↓
Backend devuelve parámetros (200 OK)
   ↓
Frontend construye tabla de 36 meses
   ↓
Frontend renderiza tabla mensual + anual
```

### **Escenario 2: Tabla de Reporte Guardado**

```
Usuario selecciona Reporte Flujo ID=23
   ↓
GET /amortizacion/reporte/23
   ↓
Backend busca flujo_historial.id = 23
   ↓
Backend lee otros_datos_json.datosPrecargados
   ↓
Backend extrae valores exactos usados
   ↓
Backend devuelve parámetros (200 OK)
   ↓
Frontend construye tabla con valores exactos
   ↓
Frontend muestra "Basado en Informe #15"
```

---

## ✅ **VENTAJAS**

1. **Payload Mínimo**: Solo 7 valores numéricos + metadata
2. **Trazabilidad**: Siempre sabes qué informe se usó
3. **Consistencia**: Frontend usa la misma lógica siempre
4. **Reproducibilidad**: Puedes recrear tablas antiguas exactamente
5. **Performance**: No envías 36 filas × múltiples campos

---

## 🧪 **Testing con cURL**

```bash
# Endpoint 1: Nueva tabla
curl -X POST http://localhost:3000/api/calculos/flujo-caja/amortizacion/parametros \
  -H "Content-Type: application/json" \
  -d '{"machineId": 4}'

# Endpoint 2: Tabla de reporte guardado
curl -X GET http://localhost:3000/api/calculos/flujo-caja/amortizacion/reporte/23
```

---

## 📝 **Notas Importantes**

1. **Valores Exactos**: El endpoint 2 garantiza que obtienes los mismos valores que se usaron al crear el reporte
2. **Sin Financiamiento**: Ambos endpoints manejan el caso donde no hay financiamiento
3. **Redondeo**: Todos los valores monetarios se redondean a 2 decimales
4. **Último Mes**: El saldo del último mes se fuerza a 0 para evitar decimales residuales

---

**Implementado por:** Sistema de Flujo de Caja  
**Fecha:** 2025-10-08  
**Versión:** 1.0.0
