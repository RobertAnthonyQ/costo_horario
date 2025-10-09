-- ============================================
-- CONFIGURACIÓN DE AUTENTICACIÓN SIMPLIFICADA
-- ============================================
-- Este archivo contiene las configuraciones necesarias para:
-- 1. Deshabilitar verificación de email
-- 2. Permitir contraseñas simples
-- 3. Configurar políticas de seguridad básicas

-- IMPORTANTE: Ejecuta esto en el SQL Editor de Supabase
-- Dashboard -> SQL Editor -> New Query -> Pega este código -> Run

-- ============================================
-- PASO 1: Configuración de Auth
-- ============================================
-- Estas configuraciones se deben hacer en el Dashboard de Supabase:
-- Settings -> Authentication -> Email Auth

/*
CONFIGURACIONES MANUALES EN SUPABASE DASHBOARD:

1. IR A: Settings -> Authentication -> Email Auth

2. DESHABILITAR:
   ☐ Confirm email
   ☐ Secure email change
   
3. CONFIGURAR:
   - Minimum Password Length: 3
   - Password Requirements: NINGUNO (desmarcar todos)
   
4. GUARDAR CAMBIOS

ALTERNATIVAMENTE, puedes usar la API de Supabase Management:
*/

-- ============================================
-- PASO 2: Actualizar configuración de Auth
-- ============================================
-- Nota: Esto requiere acceso a la tabla auth.config
-- Si tienes error, hazlo desde el Dashboard (ver arriba)

-- Comentado porque requiere permisos especiales:
-- UPDATE auth.config 
-- SET 
--   email_confirm_required = false,
--   password_required_characters = 3
-- WHERE true;

-- ============================================
-- PASO 3: Políticas RLS para public.users
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Permitir inserción durante registro" ON public.users;

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política: Permitir inserción durante registro (service_role)
CREATE POLICY "Permitir inserción durante registro"
ON public.users
FOR INSERT
WITH CHECK (true);

-- ============================================
-- PASO 4: Confirmar usuarios existentes (opcional)
-- ============================================
-- Si ya tienes usuarios sin confirmar, ejecuta esto para confirmarlos:

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ============================================
-- PASO 5: Verificar configuración
-- ============================================

-- Ver usuarios
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Ver políticas de RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public';

-- ============================================
-- ✅ CONFIGURACIÓN COMPLETA
-- ============================================

-- Ahora puedes:
-- 1. Registrar usuarios sin verificación de email
-- 2. Usar contraseñas simples (mínimo 3 caracteres)
-- 3. Login inmediato después del registro

-- Ejemplo de uso desde la aplicación:
/*
// Registro
POST /auth/register
{
  "email": "usuario@ejemplo.com",
  "password": "abc",
  "full_name": "Usuario Test"
}

// Login inmediato (sin confirmar email)
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "abc"
}
*/
