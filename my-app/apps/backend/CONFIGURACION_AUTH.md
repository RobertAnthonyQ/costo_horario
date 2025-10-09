# 🔧 Configuración de Autenticación Simplificada

## ⚙️ Pasos para Configurar Supabase

### **OPCIÓN 1: Configuración Manual (Recomendada) ✅**

1. **Ir al Dashboard de Supabase:**
   - Abre: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ir a Settings → Authentication:**

   ```
   Dashboard → Settings (⚙️) → Authentication
   ```

3. **Configurar Email Auth:**

   **En la sección "Email":**
   - ☐ **DESMARCAR**: "Confirm email"
   - ☐ **DESMARCAR**: "Secure email change"

   **En la sección "Password Requirements":**
   - **Minimum Password Length**: `3`
   - ☐ **DESMARCAR TODOS** los requisitos:
     - ☐ Contains lowercase letter
     - ☐ Contains uppercase letter
     - ☐ Contains number
     - ☐ Contains special character

4. **Guardar Cambios:**
   - Click en "Save" al final de la página

---

### **OPCIÓN 2: Configuración con SQL (Alternativa)**

Si prefieres usar SQL, ejecuta el archivo:

```bash
apps/backend/supabase_auth_config.sql
```

**Pasos:**

1. Abre Supabase Dashboard → SQL Editor
2. Click en "New Query"
3. Copia y pega el contenido de `supabase_auth_config.sql`
4. Click en "Run"

---

## ✅ Verificar Configuración

### **Probar Registro:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "abc",
    "full_name": "Usuario Test"
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Ya puedes iniciar sesión.",
  "user": { ... },
  "session": { ... }
}
```

### **Probar Login Inmediato:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "abc"
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": { ... },
  "session": { ... }
}
```

---

## 🔍 Solución de Problemas

### ❌ Error: "Email not confirmed"

**Solución:**

1. Verifica que hayas DESMARCADO "Confirm email" en Supabase
2. Si ya tienes usuarios registrados, ejecútalos esto en SQL Editor:

```sql
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### ❌ Error: "Password is too weak"

**Solución:**

1. Verifica que "Minimum Password Length" sea `3`
2. Desmarca TODOS los "Password Requirements"
3. Guarda y recarga la página

### ❌ Error: "Invalid password"

**Causa:** Supabase aún tiene configuración antigua en caché

**Solución:**

1. Espera 1-2 minutos después de guardar cambios
2. Cierra sesión en Supabase Dashboard y vuelve a entrar
3. Verifica la configuración nuevamente

---

## 📋 Checklist de Configuración

- [ ] Dashboard de Supabase abierto
- [ ] Settings → Authentication → Email
- [ ] "Confirm email" DESMARCADO
- [ ] "Minimum Password Length" = 3
- [ ] Todos los "Password Requirements" DESMARCADOS
- [ ] Cambios guardados con "Save"
- [ ] Esperado 1-2 minutos para propagación
- [ ] Probado registro con contraseña simple
- [ ] Probado login inmediato

---

## 🎉 ¡Listo!

Ahora puedes:

- ✅ Registrar usuarios sin verificación de email
- ✅ Usar contraseñas simples (mínimo 3 caracteres, solo minúsculas)
- ✅ Login inmediato después del registro
- ✅ Sin envío de emails de confirmación

---

## 📝 Cambios Realizados en el Código

### **Backend:**

1. `auth.service.ts` - Mensaje sin verificación de email
2. `login.dto.ts` - Contraseña mínima 3 caracteres
3. `register.dto.ts` - Contraseña mínima 3 caracteres
4. `supabase_auth_config.sql` - Script de configuración SQL

### **Configuración Supabase:**

- Email confirmation: DESHABILITADO
- Password requirements: SIMPLES (3 caracteres mínimo)
- RLS policies: CONFIGURADAS para public.users

---

¿Necesitas ayuda con algún paso? 🚀
