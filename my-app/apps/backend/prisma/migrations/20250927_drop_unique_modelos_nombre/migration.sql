-- DropIndex
-- Esta migración elimina el constraint único en (marca_id, nombre) de la tabla modelos
-- para permitir múltiples modelos con el mismo nombre en la misma marca

-- Primero intentamos eliminar como constraint único
DO $$ 
BEGIN
    -- Buscar y eliminar constraints únicos que contengan marca_id y nombre
    PERFORM constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'modelos' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name IN (
          SELECT constraint_name 
          FROM information_schema.key_column_usage 
          WHERE table_name = 'modelos' 
            AND column_name IN ('marca_id', 'nombre')
          GROUP BY constraint_name 
          HAVING COUNT(*) >= 2
      );
      
    -- Si existe, eliminar el constraint
    IF FOUND THEN
        EXECUTE 'ALTER TABLE "modelos" DROP CONSTRAINT ' || (
            SELECT constraint_name FROM information_schema.table_constraints 
            WHERE table_name = 'modelos' 
              AND constraint_type = 'UNIQUE' 
              AND constraint_name IN (
                  SELECT constraint_name 
                  FROM information_schema.key_column_usage 
                  WHERE table_name = 'modelos' 
                    AND column_name IN ('marca_id', 'nombre')
                  GROUP BY constraint_name 
                  HAVING COUNT(*) >= 2
              )
            LIMIT 1
        );
    END IF;
EXCEPTION 
    WHEN OTHERS THEN 
        NULL; -- Ignorar errores si no existe
END $$;

-- Alternativamente, eliminar índices únicos que puedan existir
DROP INDEX IF EXISTS "modelos_marca_id_nombre_key";
DROP INDEX IF EXISTS "modelos_marca_id_nombre_unique";
DROP INDEX IF EXISTS "idx_modelos_marca_nombre_unique";
DROP INDEX IF EXISTS "unique_modelos_marca_nombre";

-- Verificar que se puede insertar duplicados (comentado para no insertar datos reales)
-- INSERT INTO "modelos" (nombre, marca_id, porcentaje_utilidad, created_at) 
-- VALUES ('Modelo Test', 1, 0.0, NOW()) ON CONFLICT DO NOTHING;