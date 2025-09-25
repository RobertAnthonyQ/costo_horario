-- Script SQL para agregar las columnas ratios_version y lugar_operacion
-- Ejecutar manualmente en Supabase Dashboard -> SQL Editor

-- 1. Agregar las columnas si no existen
ALTER TABLE public.ratios_historico 
ADD COLUMN IF NOT EXISTS ratios_version JSONB,
ADD COLUMN IF NOT EXISTS lugar_operacion TEXT;

-- 2. Agregar comentarios descriptivos para las columnas
COMMENT ON COLUMN public.ratios_historico.ratios_version IS 'Versión JSON completa de ratios - solo se guarda cuando se proporciona explícitamente';
COMMENT ON COLUMN public.ratios_historico.lugar_operacion IS 'Ubicación física donde se registra el ratio (ej: Mina Norte - Sector A)';

-- 3. Crear índices para mejorar rendimiento de consultas (opcional pero recomendado)

-- Índice GIN para búsquedas eficientes en el campo JSON
CREATE INDEX IF NOT EXISTS idx_ratios_historico_ratios_version_gin 
ON public.ratios_historico USING GIN (ratios_version);

-- Índice para búsquedas por lugar de operación (texto)
CREATE INDEX IF NOT EXISTS idx_ratios_historico_lugar_operacion 
ON public.ratios_historico (lugar_operacion);

-- Índice compuesto para consultas que filtren por ambos campos
CREATE INDEX IF NOT EXISTS idx_ratios_historico_lugar_version 
ON public.ratios_historico (lugar_operacion, ratios_version) 
WHERE ratios_version IS NOT NULL;

-- 4. Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ratios_historico' 
    AND table_schema = 'public'
    AND column_name IN ('ratios_version', 'lugar_operacion')
ORDER BY column_name;

-- 5. Mostrar ejemplo de estructura esperada para ratios_version
/*
Ejemplo de estructura JSON para ratios_version:
{
  "fecha_efectiva": "2025-09-24T15:30:00.000Z",
  "ratios": [
    {
      "tipo_ratio_id": 1,
      "tipo_ratio_nombre": "Disponibilidad",
      "valor": 0.8500,
      "categoria": "Preventivo"
    },
    {
      "tipo_ratio_id": 2,
      "tipo_ratio_nombre": "Utilización",
      "valor": 0.7200,
      "categoria": "Correctivo"
    }
  ],
  "comentario": "Versión mensual completa",
  "usuario_id": "operador123"
}
*/

-- 6. Consulta de prueba para verificar funcionalidad
SELECT 
    id,
    modelo_id,
    tipo_ratio_id,
    valor,
    fecha_efectiva,
    lugar_operacion,
    ratios_version IS NOT NULL as tiene_version_json,
    CASE 
        WHEN ratios_version IS NOT NULL 
        THEN jsonb_array_length(ratios_version->'ratios')
        ELSE 0 
    END as cantidad_ratios_en_version
FROM public.ratios_historico 
LIMIT 5;

-- Script completado exitosamente
-- Las nuevas columnas están listas para uso en la aplicación