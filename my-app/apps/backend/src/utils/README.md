# BigInt Serializer Utility

Esta utilidad resuelve el problema de serialización de `BigInt` en NestJS cuando se devuelven datos desde Prisma.

## Problema

Prisma devuelve campos de tipo `BigInt` para IDs, objetos `Decimal` para números decimales, y objetos `Date` para fechas, pero `JSON.stringify()` no puede serializar estos tipos por defecto, causando el error:

```
TypeError: Do not know how to serialize a BigInt
```

Y también problemas con objetos `Decimal` y `Date` que se muestran como `[object Object]` o "Invalid Date" en el frontend.

## Solución

### 1. Importar las funciones

```typescript
import {
  serializeBigInt,
  serializeBigIntArray,
} from '../../../utils/bigint-serializer';
```

### 2. Usar en servicios

#### Para un solo objeto:

```typescript
async findOne(id: number): Promise<MyEntity> {
  const entity = await this.prisma.myEntity.findUnique({
    where: { id },
    include: {
      relation: true,
    },
  });

  if (!entity) {
    throw new NotFoundException('Entity not found');
  }

  // Convertir automáticamente todos los BigInt, Decimal y Date a tipos serializables
  return serializeBigInt(entity);
}
```

#### Para arrays de objetos:

```typescript
async findAll(): Promise<MyEntity[]> {
  const entities = await this.prisma.myEntity.findMany({
    include: {
      relation: true,
    },
  });

  // Convertir automáticamente todos los BigInt, Decimal y Date a tipos serializables
  return serializeBigIntArray(entities);
}
```

### 3. Ejemplo completo

**Antes (problemático):**

```typescript
async findAll(): Promise<Machine[]> {
  const machines = await this.prisma.machines.findMany({
    include: {
      modelo: {
        include: {
          marca: true,
          equipo: true,
        },
      },
    },
  });

  return machines; // ❌ Error: BigInt serialization
}
```

**Después (solución):**

```typescript
import { serializeBigIntArray } from '../../../utils/bigint-serializer';

async findAll(): Promise<Machine[]> {
  const machines = await this.prisma.machines.findMany({
    include: {
      modelo: {
        include: {
          marca: true,
          equipo: true,
        },
      },
    },
  });

  // ✅ Convierte automáticamente todos los BigInt, Decimal y Date a tipos serializables
  return serializeBigIntArray(machines);
}
```

## Funciones disponibles

### `serializeBigInt<T>(obj: T): T`

- Convierte recursivamente todos los `BigInt`, `Decimal` y `Date` a tipos serializables
- Funciona con objetos anidados y arrays
- Mantiene la estructura original del objeto

### `serializeBigIntArray<T>(arr: T[]): T[]`

- Específica para arrays de objetos
- Aplica `serializeBigInt` a cada elemento del array

## Campos que se convierten automáticamente

- `id` (todos los IDs de Prisma) → Number
- `modelo_id`, `marca_id`, `equipo_id`, etc. (foreign keys) → Number
- `valor_venta`, `valor_similar_nuevo`, etc. (campos monetarios) → Number
- `vida_util`, `tiempo_entrega`, etc. (campos numéricos) → Number
- `fecha_calculo`, `created_at`, `updated_at`, etc. (fechas) → ISO String
- Cualquier campo `BigInt`, `Decimal` o `Date` en relaciones anidadas

## Ventajas

1. **Automático**: No necesitas especificar cada campo manualmente
2. **Recursivo**: Funciona con objetos anidados y relaciones complejas
3. **Reutilizable**: Una sola función para todos los servicios
4. **Mantenible**: Si Prisma cambia el esquema, no necesitas actualizar el código
5. **Seguro**: Preserva la estructura de datos original

## Servicios que ya usan esta utilidad

- ✅ `MachinesService` - Todos los métodos
- ✅ `InformeCostoHorarioService` - Métodos de historial
- 🔄 Otros servicios pueden migrar usando este patrón
