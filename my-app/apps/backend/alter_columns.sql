-- Cambiar tipos Float a Numeric (Decimal) para resolver problemas de precisión
-- y remover la columna distribucion ya que ahora es un campo calculado
ALTER TABLE modelo_componentes_historico 
  ALTER COLUMN monto_usd TYPE NUMERIC(10,2),
  ALTER COLUMN pcr TYPE NUMERIC(10,2),
  DROP COLUMN IF EXISTS distribucion;