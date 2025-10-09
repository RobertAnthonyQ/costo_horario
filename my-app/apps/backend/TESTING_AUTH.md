# 🧪 Ejemplos de Testing - Autenticación

## 📋 Requisitos Previos

1. ✅ Backend corriendo en `http://localhost:3000`
2. ✅ Supabase configurado (ver `CONFIGURACION_AUTH.md`)
3. ✅ Base de datos disponible

---

## 🚀 Probar con cURL

### **1. Registro de Usuario**

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
  "user": {
    "id": "uuid-del-usuario",
    "email": "test@ejemplo.com",
    "full_name": "Usuario Test",
    "avatar_url": null,
    "created_at": "2025-10-09T12:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 3600,
    "expires_at": 1736514000
  }
}
```

---

### **2. Login (Inmediato, sin verificar email)**

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
  "user": {
    "id": "uuid-del-usuario",
    "email": "test@ejemplo.com",
    "full_name": "Usuario Test",
    "avatar_url": null,
    "created_at": "2025-10-09T12:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 3600,
    "expires_at": 1736514000
  }
}
```

---

### **3. Obtener Usuario Actual (Requiere Token)**

**Primero, copia el `access_token` del login anterior**

```bash
# Reemplaza <TU_TOKEN> con el access_token real
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <TU_TOKEN>"
```

**Ejemplo completo:**

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Usuario obtenido exitosamente",
  "user": {
    "id": "uuid-del-usuario",
    "email": "test@ejemplo.com",
    "full_name": "Usuario Test",
    "avatar_url": null,
    "created_at": "2025-10-09T12:00:00Z"
  }
}
```

---

### **4. Logout**

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <TU_TOKEN>"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### **5. Refrescar Token**

```bash
# Copia el refresh_token del login
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<TU_REFRESH_TOKEN>"
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Sesión refrescada exitosamente",
  "session": {
    "access_token": "nuevo_token...",
    "refresh_token": "nuevo_refresh_token...",
    "expires_in": 3600,
    "expires_at": 1736517600
  }
}
```

---

### **6. Recuperar Contraseña**

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com"
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña"
}
```

---

## 🧪 Probar Ruta Protegida

### **Ejemplo: GET /componentes (Requiere Auth)**

```bash
# Sin token (debería fallar)
curl http://localhost:3000/componentes

# Con token (debería funcionar)
curl http://localhost:3000/componentes \
  -H "Authorization: Bearer <TU_TOKEN>"
```

---

## 📝 Script de Testing Completo

Crea un archivo `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🚀 Iniciando testing de autenticación..."
echo ""

# 1. Registro
echo "1️⃣ Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "abc",
    "full_name": "Usuario Test"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 2. Login
echo "2️⃣ Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "abc"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.session.access_token')

echo "🔑 Token obtenido: ${TOKEN:0:50}..."
echo ""

# 3. Obtener usuario actual
echo "3️⃣ Obteniendo usuario actual..."
curl -s http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 4. Probar ruta protegida
echo "4️⃣ Probando ruta protegida (/componentes)..."
curl -s http://localhost:3000/componentes \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 5. Logout
echo "5️⃣ Cerrando sesión..."
curl -s -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "✅ Testing completado!"
```

**Ejecutar:**

```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## 🌐 Probar con Postman/Insomnia

### **Collection de Postman:**

1. **Crear Collection**: "Autenticación API"

2. **Agregar Requests:**

   **a) Register**
   - Method: POST
   - URL: `http://localhost:3000/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "test@ejemplo.com",
       "password": "abc",
       "full_name": "Usuario Test"
     }
     ```

   **b) Login**
   - Method: POST
   - URL: `http://localhost:3000/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@ejemplo.com",
       "password": "abc"
     }
     ```
   - Tests (para guardar token):
     ```javascript
     pm.environment.set(
       'access_token',
       pm.response.json().session.access_token,
     );
     ```

   **c) Get Me**
   - Method: GET
   - URL: `http://localhost:3000/auth/me`
   - Headers:
     ```
     Authorization: Bearer {{access_token}}
     ```

   **d) Logout**
   - Method: POST
   - URL: `http://localhost:3000/auth/logout`
   - Headers:
     ```
     Authorization: Bearer {{access_token}}
     ```

---

## 📊 Casos de Prueba

### ✅ **Casos Exitosos:**

1. ✅ Registro con email válido y contraseña simple
2. ✅ Login inmediato sin verificar email
3. ✅ Obtener usuario con token válido
4. ✅ Acceder a rutas protegidas con token
5. ✅ Refrescar token con refresh_token
6. ✅ Logout con token válido

### ❌ **Casos de Error:**

1. ❌ Registro con email duplicado
2. ❌ Login con credenciales incorrectas
3. ❌ Acceder a ruta protegida sin token
4. ❌ Acceder con token expirado
5. ❌ Obtener usuario con token inválido

---

## 🐛 Troubleshooting

### Error: "Token de autenticación requerido"

```bash
# Solución: Agregar header Authorization
curl http://localhost:3000/componentes \
  -H "Authorization: Bearer <TU_TOKEN>"
```

### Error: "Credenciales inválidas"

```bash
# Verificar que el usuario esté registrado
# Verificar que la contraseña sea correcta
# Verificar configuración de Supabase (CONFIGURACION_AUTH.md)
```

### Error: "Email not confirmed"

```bash
# Ejecutar en Supabase SQL Editor:
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## 📖 Documentación Interactiva

Accede a Swagger para probar directamente desde el navegador:

```
http://localhost:3000/api/docs
```

**Pasos:**

1. Abre Swagger UI
2. Ejecuta `/auth/login`
3. Copia el `access_token`
4. Click en 🔒 "Authorize"
5. Pega: `Bearer <token>`
6. Prueba cualquier endpoint protegido

---

✅ **¡Listo para probar!** 🚀
