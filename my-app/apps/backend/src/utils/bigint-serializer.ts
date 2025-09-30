/**
 * Función utilitaria para convertir BigInt, Decimal y Date a tipos serializables para JSON
 * Recursivamente recorre un objeto y convierte todos los BigInt, Decimal y Date a tipos apropiados
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as unknown as T;
  }

  // Manejar objetos Date de JavaScript
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  // Manejar objetos Decimal de Prisma
  if (typeof obj === 'object' && obj !== null) {
    // Verificar si es un objeto Decimal de Prisma (tiene método toNumber)
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber() as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(serializeBigInt) as unknown as T;
    }

    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized as T;
  }

  return obj;
}

/**
 * Función específica para arrays de objetos
 */
export function serializeBigIntArray<T>(arr: T[]): T[] {
  return arr.map((item) => serializeBigInt(item));
}
