-- SQL para ejecutar en Supabase SQL Editor
-- Elimina el constraint único en (marca_id, nombre) de la tabla modelos

-- 1. Primero, consultar qué constraints únicos existen en la tabla modelos
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'modelos' AND constraint_type = 'UNIQUE';

-- 2. Ver los índices únicos en la tabla modelos
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'modelos' AND indexdef ILIKE '%unique%';

-- 3. Eliminar el constraint único (ejecuta después de ver el resultado de las consultas anteriores)
-- Reemplaza 'NOMBRE_DEL_CONSTRAINT' por el nombre real que encuentres

-- Si es un constraint:
-- ALTER TABLE "modelos" DROP CONSTRAINT "NOMBRE_DEL_CONSTRAINT";

-- Si es un índice único, usa uno de estos (prueba los nombres más comunes):
DROP INDEX IF EXISTS "modelos_marca_id_nombre_key";
DROP INDEX IF EXISTS "modelos_marca_id_nombre_unique"; 
DROP INDEX IF EXISTS "idx_modelos_marca_nombre_unique";
DROP INDEX IF EXISTS "unique_modelos_marca_nombre";

-- 4. Verificar que se eliminó correctamente
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'modelos' AND constraint_type = 'UNIQUE';

-- 5. Prueba opcional: insertar duplicados (cambia los valores por datos reales de tu BD)
-- INSERT INTO "modelos" (nombre, marca_id, porcentaje_utilidad, created_at) 
-- VALUES ('Test Duplicado', 1, 0.0, NOW());
-- INSERT INTO "modelos" (nombre, marca_id, porcentaje_utilidad, created_at) 
-- VALUES ('Test Duplicado', 1, 0.0, NOW());