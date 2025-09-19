# Ejemplos de Uso - Módulo de Posesión

## 📋 Descripción General

El módulo de posesión calcula la depreciación y valor comercial de máquinas basándose en diferentes escenarios de horas de operación mensuales. Cada escenario puede tener su propio grado de operatividad y factor de mercado, permitiendo análisis más detallados y específicos.

## 🔧 Endpoints Disponibles

### 1. POST `/calculos/posesion` - Calcular y Guardar

Realiza el cálculo completo y lo guarda en el historial.

### 2. POST `/calculos/posesion/preview` - Vista Previa

Realiza el cálculo sin guardarlo (útil para validación).

### 3. GET `/calculos/posesion/machine/:machineId` - Historial por Máquina

Obtiene todo el historial de cálculos de una máquina específica.

### 4. GET `/calculos/posesion/:id` - Registro Específico

Obtiene un registro específico del historial.

## 📝 Ejemplos de Request Body

### Ejemplo Básico (2 escenarios)

```json
{
  "machine_id": 1,
  "horas_json": {
    "escenarios": [
      {
        "horasMinimas": 450,
        "gradoDeOperatividad": 0.8,
        "factorDeMercado": 0.55
      },
      {
        "horasMinimas": 500,
        "gradoDeOperatividad": 0.75,
        "factorDeMercado": 0.6
      }
    ]
  },
  "comentario": "Cálculo de posesión para análisis de viabilidad",
  "usuario_id": "user-uuid-123"
}
```

### Ejemplo Avanzado (4 escenarios)

```json
{
  "machine_id": 2,
  "horas_json": {
    "escenarios": [
      {
        "horasMinimas": 200,
        "gradoDeOperatividad": 0.95,
        "factorDeMercado": 1.1
      },
      {
        "horasMinimas": 250,
        "gradoDeOperatividad": 0.9,
        "factorDeMercado": 1.05
      },
      {
        "horasMinimas": 300,
        "gradoDeOperatividad": 0.85,
        "factorDeMercado": 1.0
      },
      {
        "horasMinimas": 350,
        "gradoDeOperatividad": 0.8,
        "factorDeMercado": 0.95
      }
    ]
  },
  "comentario": "Evaluación para diferentes condiciones operativas"
}
```

### Ejemplo Conservador (3 escenarios)

```json
{
  "machine_id": 3,
  "horas_json": {
    "escenarios": [
      {
        "horasMinimas": 180,
        "gradoDeOperatividad": 0.7,
        "factorDeMercado": 0.8
      },
      {
        "horasMinimas": 220,
        "gradoDeOperatividad": 0.75,
        "factorDeMercado": 0.85
      },
      {
        "horasMinimas": 280,
        "gradoDeOperatividad": 0.8,
        "factorDeMercado": 0.9
      }
    ]
  },
  "comentario": "Análisis conservador para máquina con desgaste"
}
```

### Ejemplo Optimista (5 escenarios)

```json
{
  "machine_id": 4,
  "horas_json": {
    "escenarios": [
      {
        "horasMinimas": 250,
        "gradoDeOperatividad": 0.95,
        "factorDeMercado": 1.15
      },
      {
        "horasMinimas": 300,
        "gradoDeOperatividad": 0.92,
        "factorDeMercado": 1.12
      },
      {
        "horasMinimas": 350,
        "gradoDeOperatividad": 0.9,
        "factorDeMercado": 1.1
      },
      {
        "horasMinimas": 400,
        "gradoDeOperatividad": 0.88,
        "factorDeMercado": 1.08
      },
      {
        "horasMinimas": 450,
        "gradoDeOperatividad": 0.85,
        "factorDeMercado": 1.05
      }
    ]
  },
  "comentario": "Máquina en excelente estado - mercado favorable"
}
```

## 📊 Parámetros Explicados

### `machine_id` (number, requerido)

- ID de la máquina en la base de datos
- Debe existir en la tabla `machines`

### `horas_json.escenarios` (array, requerido)

- Array de objetos que representan diferentes escenarios
- Cada escenario contiene sus propios parámetros específicos
- Mínimo 1 escenario requerido

#### Estructura de cada escenario:

### `horasMinimas` (number, requerido)

- Horas mínimas mensuales para este escenario específico
- Valores típicos: 150-500 horas/mes
- Debe ser mayor a 0

### `gradoDeOperatividad` (number, requerido)

- Rango: 0.0 a 1.0
- Representa el estado operativo de la máquina para este escenario
- **0.95-1.0**: Máquina nueva/excelente estado
- **0.85-0.94**: Muy buen estado
- **0.75-0.84**: Buen estado
- **0.65-0.74**: Estado regular
- **0.5-0.64**: Requiere mantenimiento
- **<0.5**: Estado deficiente

### `factorDeMercado` (number, requerido)

- Rango: 0.0 a 2.0 (típicamente 0.8-1.2)
- Ajusta el valor según condiciones del mercado para este escenario
- **1.0+**: Mercado favorable/alta demanda
- **0.9-0.99**: Mercado normal
- **<0.9**: Mercado desfavorable/baja demanda

### `comentario` (string, opcional)

- Descripción del propósito del cálculo
- Observaciones adicionales sobre todos los escenarios

### `usuario_id` (string, opcional)

- ID del usuario que realiza el cálculo
- Para trazabilidad y auditoría

## 🧮 Cálculos Realizados

Para cada escenario de horas, el sistema calcula:

1. **Años de vida ideal** = vida útil del fabricante / (horas mínimas × 12)
2. **Valor residual** = 0.1 × valor similar nuevo
3. **Depreciación teórica** = valor similar nuevo - valor residual
4. **Valor comercial teórico** = (valor similar nuevo - depreciación teórica) × grado de operatividad
5. **Valor comercial real** = valor comercial teórico × factor de mercado
6. **% Valor comercial real** = (valor comercial real / valor similar nuevo) × 100
7. **Depreciación real** = valor similar nuevo - valor comercial real
8. **Depreciación real anual** = depreciación real / años de vida ideal
9. **Depreciación real horaria** = depreciación real anual / (horas mínimas × 12)

## ✅ Ejemplo de Respuesta

```json
{
  "id": 15,
  "machine_id": 1,
  "usuario_id": "user-uuid-123",
  "resultados_json": {
    "escenarios": [
      {
        "horasMinimas": 200,
        "aniosVidaIdeal": 8.33,
        "vidaUtilFabricante": 20000,
        "depreciacionTeorica": 450000,
        "gradoDeOperatividad": 0.85,
        "valorComercialTeorico": 382500,
        "factorDeMercado": 0.9,
        "valorComercialReal": 344250,
        "porcentajeValorComercialReal": 68.85,
        "depreciacionReal": 155750,
        "depreciacionRealAnual": 18690,
        "depreciacionRealHoraria": 7.79
      }
    ],
    "machine_id": 1,
    "fecha_calculo": "2025-09-14T10:30:00.000Z",
    "inputs": { ... }
  },
  "horas_json": {
    "horasMinimas": [200, 250, 300]
  },
  "comentario": "Análisis de viabilidad económica",
  "fecha_calculo": "2025-09-14T10:30:00.000Z",
  "machine_info": {
    "id": 1,
    "id_equipo_interno": "EXC-001",
    "modelo": { ... }
  }
}
```

## 🚨 Posibles Errores

### 404 - Machine not found

```json
{
  "message": "Machine with ID 1 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 400 - Bad Request

```json
{
  "message": [
    "machine_id must be a number",
    "El grado de operatividad debe estar entre 0 y 1"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🔍 Testing en Swagger

1. Accede a `/api` en tu aplicación
2. Busca la sección "Cálculos de Posesión"
3. Usa el endpoint `/calculos/posesion/preview` para pruebas iniciales
4. Una vez validado, usa `/calculos/posesion` para guardar el cálculo

## 💡 Tips de Uso

- Usa **preview** primero para validar resultados antes de guardar
- **Flexibilidad por escenario**: Cada escenario puede tener diferentes valores de:
  - Grado de operatividad (para simular diferentes estados de la máquina)
  - Factor de mercado (para diferentes condiciones económicas)
- **Valores típicos por escenario**:
  - Grado de operatividad: 0.7-0.95 (dependiendo del desgaste esperado)
  - Factor de mercado: 0.8-1.2 (según condiciones del mercado)
- **Análisis progresivo**: Usa escenarios con horas crecientes y factores decrecientes para simular el deterioro en el tiempo
- Incluye múltiples escenarios para análisis completo de diferentes condiciones
- El comentario ayuda a contextualizar el cálculo para futuras referencias
