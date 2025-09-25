# 🎯 Ejemplos de uso - Control Manual de ratios_version

## ✅ **Funcionalidad removida: NO hay generación automática**

### **Caso 1: Crear ratio simple SIN versión JSON**

```bash
POST /ratios-historico
{
  "modelo_id": 1,
  "tipo_ratio_id": 1,
  "valor": 0.85,
  "fecha_efectiva": "2025-09-24T10:00:00Z",
  "lugar_operacion": "Mina Norte - Sector A"
}

# Resultado: ratios_version será NULL en la base de datos
```

### **Caso 2: Crear ratio CON versión JSON manual**

```bash
POST /ratios-historico
{
  "modelo_id": 1,
  "tipo_ratio_id": 1,
  "valor": 0.85,
  "fecha_efectiva": "2025-09-24T10:00:00Z",
  "lugar_operacion": "Mina Norte - Sector A",
  "ratios_version": {
    "fecha_efectiva": "2025-09-24T10:00:00Z",
    "ratios": [
      {
        "tipo_ratio_id": 1,
        "tipo_ratio_nombre": "Disponibilidad",
        "valor": 0.85,
        "categoria": "Preventivo"
      },
      {
        "tipo_ratio_id": 2,
        "tipo_ratio_nombre": "Utilización",
        "valor": 0.75,
        "categoria": "Correctivo"
      }
    ],
    "comentario": "Snapshot manual de fin de turno",
    "usuario_id": "operador123"
  }
}

# Resultado: ratios_version se guarda exactamente como lo enviaste
```

### **Caso 3: Crear versión completa automática (usando endpoint específico)**

```bash
POST /ratios-historico/create-complete-version/1
{
  "comentario": "Reporte semanal completo",
  "usuario_id": "supervisor456",
  "lugar_operacion": "Mina Norte - Sector A"
}

# Este SÍ genera automáticamente una versión con TODOS los ratios actuales del modelo
```

## 🎯 **Control total en tus manos:**

1. **Por defecto**: `ratios_version` será `NULL`
2. **Solo se guarda**: Si tú explícitamente lo envías
3. **Generación automática**: Solo con el endpoint específico `/create-complete-version/:id`

## 📋 **Beneficios:**

- ✅ Control total sobre cuándo crear versiones JSON
- ✅ No hay datos "sorpresa" generados automáticamente
- ✅ Base de datos más limpia y eficiente
- ✅ Tú decides cuándo hacer "snapshots" completos
