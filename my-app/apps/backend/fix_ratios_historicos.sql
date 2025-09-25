-- Script para verificar y corregir problemas con los ratios históricos

-- 1. Verificar si existe el tipo_ratio_id = 100 (necesario para historiales completos)
SELECT * FROM tipos_ratio WHERE id = 100;

-- 2. Si no existe, crearlo
INSERT INTO tipos_ratio (id, nombre, categoria, created_at) 
VALUES (100, 'Historial Completo', 'Preventivo', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar todos los tipos de ratio disponibles
SELECT id, nombre, categoria, created_at FROM tipos_ratio ORDER BY id;

-- 4. Verificar modelos disponibles
SELECT id, nombre, marca_id FROM modelos ORDER BY id LIMIT 10;

-- 5. Verificar si hay registros problemáticos en ratios_historico
SELECT id, modelo_id, tipo_ratio_id, fecha_efectiva, lugar_operacion
FROM ratios_historico 
WHERE tipo_ratio_id NOT IN (SELECT id FROM tipos_ratio)
   OR modelo_id NOT IN (SELECT id FROM modelos);

-- 6. Contar registros por tipo_ratio_id para estadísticas
SELECT tipo_ratio_id, COUNT(*) as cantidad
FROM ratios_historico 
GROUP BY tipo_ratio_id 
ORDER BY tipo_ratio_id;