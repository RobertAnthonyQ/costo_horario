# 🔐 Guía de Uso: Swagger con Autenticación

## 📖 Cómo Probar la API con Swagger

### **Paso 1: Acceder a Swagger UI**

Abre tu navegador y ve a:

```
http://localhost:3000/api/docs
```

Verás la interfaz de Swagger con todos los endpoints documentados.

---

### **Paso 2: Hacer Login (Obtener Token)**

1. **Busca la sección "Autenticación"** (arriba de la lista)

2. **Expande el endpoint:** `POST /auth/login`

3. **Click en "Try it out"**

4. **Ingresa tus credenciales:**

   ```json
   {
     "email": "test@ejemplo.com",
     "password": "abc"
   }
   ```

5. **Click en "Execute"**

6. **Copia el `access_token`** de la respuesta:
   ```json
   {
     "success": true,
     "message": "Login exitoso",
     "session": {
       "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  ← COPIA ESTO
       "refresh_token": "...",
       "expires_in": 3600
     }
   }
   ```

---

### **Paso 3: Autorizar en Swagger 🔒**

1. **Busca el botón "Authorize"** (esquina superior derecha de Swagger)
   - Es un botón con un candado 🔒

2. **Click en "Authorize"**

3. **Se abrirá un modal "Available authorizations"**

4. **Verás un campo "Value" bajo "JWT-auth (http, Bearer)"**

5. **Pega SOLO el token** (sin escribir "Bearer"):

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **NO escribas:** `Bearer eyJhbGci...`
   ✅ **Solo escribe:** `eyJhbGci...`

6. **Click en "Authorize"**

7. **Click en "Close"**

---

### **Paso 4: Probar Endpoints Protegidos**

Ahora puedes usar **cualquier endpoint protegido**:

#### **Ejemplo 1: Obtener Usuario Actual**

1. Expande: `GET /auth/me`
2. Click "Try it out"
3. Click "Execute"
4. ✅ Verás tu información de usuario

#### **Ejemplo 2: Listar Componentes**

1. Expande: `GET /componentes`
2. Click "Try it out"
3. Click "Execute"
4. ✅ Verás la lista de componentes

#### **Ejemplo 3: Crear Componente**

1. Expande: `POST /componentes`
2. Click "Try it out"
3. Ingresa datos:
   ```json
   {
     "nombre": "Motor V8"
   }
   ```
4. Click "Execute"
5. ✅ Componente creado

---

### **Paso 5: Cerrar Sesión**

Cuando termines de probar:

1. Expande: `POST /auth/logout`
2. Click "Try it out"
3. Click "Execute"
4. ✅ Sesión cerrada

O simplemente:

1. Click en "Authorize" 🔒
2. Click en "Logout"
3. Click en "Close"

---

## 🎨 Visual: Cómo se ve Swagger

```
┌─────────────────────────────────────────────────────────────┐
│  Gestión de Activos API                    [Authorize 🔒]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📁 Autenticación (Endpoints públicos y protegidos)          │
│    ├─ POST   /auth/register    ✅ Público                    │
│    ├─ POST   /auth/login       ✅ Público                    │
│    ├─ POST   /auth/logout      🔒 Protegido                  │
│    ├─ GET    /auth/me          🔒 Protegido                  │
│    ├─ POST   /auth/refresh     ✅ Público                    │
│    └─ POST   /auth/reset-password ✅ Público                 │
│                                                               │
│  📁 Componentes (Todos protegidos 🔒)                        │
│    ├─ GET    /componentes      🔒 Requiere token             │
│    ├─ POST   /componentes      🔒 Requiere token             │
│    ├─ GET    /componentes/{id} 🔒 Requiere token             │
│    ├─ PATCH  /componentes/{id} 🔒 Requiere token             │
│    └─ DELETE /componentes/{id} 🔒 Requiere token             │
│                                                               │
│  📁 Máquinas (Todos protegidos 🔒)                           │
│  📁 Modelos (Todos protegidos 🔒)                            │
│  📁 Cálculos (Todos protegidos 🔒)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Identificar Endpoints Protegidos

En Swagger, los endpoints protegidos tienen:

- **Candado cerrado** 🔒 al lado del nombre
- **Requieren autorización** para funcionar
- **Retornan 401** si no estás autenticado

Endpoints públicos:

- **Sin candado** (o candado abierto)
- **No requieren token**
- **Funcionan sin autenticación**

---

## ⚠️ Troubleshooting

### ❌ Error: "Token de autenticación requerido"

**Causa:** No has autorizado en Swagger

**Solución:**

1. Click en "Authorize" 🔒
2. Pega tu token
3. Click "Authorize"
4. Intenta de nuevo

---

### ❌ Error: "Token inválido o expirado"

**Causa:** El token expiró (después de 1 hora)

**Solución:**

1. Haz login de nuevo: `POST /auth/login`
2. Copia el nuevo `access_token`
3. Click "Authorize" 🔒
4. Pega el nuevo token
5. Click "Authorize"

---

### ❌ Error: "Unauthorized" en todos los endpoints

**Causa:** Token no está correctamente configurado

**Solución:**

1. Verifica que copiaste **TODO** el token (es largo)
2. Verifica que **NO** incluiste "Bearer" al inicio
3. Intenta copiar/pegar de nuevo
4. Si persiste, haz logout y login nuevamente

---

### ❌ No veo el botón "Authorize"

**Causa:** Swagger no está configurado correctamente

**Solución:**

1. Verifica que el backend esté corriendo
2. Recarga la página de Swagger
3. Verifica que estés en: `http://localhost:3000/api/docs`

---

## 📋 Checklist de Testing en Swagger

- [ ] Swagger abierto en `http://localhost:3000/api/docs`
- [ ] Hice login en `POST /auth/login`
- [ ] Copié el `access_token` de la respuesta
- [ ] Click en botón "Authorize" 🔒
- [ ] Pegué el token (sin "Bearer")
- [ ] Click en "Authorize" y luego "Close"
- [ ] Probé `GET /auth/me` (debería funcionar)
- [ ] Probé `GET /componentes` (debería funcionar)
- [ ] Todos los endpoints protegidos funcionan ✅

---

## 🎯 Flujo Completo de Testing

```bash
1. Abrir Swagger
   → http://localhost:3000/api/docs

2. Registrar usuario (opcional)
   → POST /auth/register
   → Datos: { email, password, full_name }

3. Hacer login
   → POST /auth/login
   → Copiar access_token de la respuesta

4. Autorizar en Swagger
   → Click "Authorize" 🔒
   → Pegar token (sin "Bearer")
   → Click "Authorize"

5. Probar endpoints protegidos
   → GET /auth/me
   → GET /componentes
   → POST /componentes
   → etc.

6. Cerrar sesión (opcional)
   → POST /auth/logout
   → O click "Authorize" → "Logout"
```

---

## 💡 Tips

### **Copiar Token Rápidamente:**

1. Después del login, busca `"access_token": "`
2. Selecciona desde las comillas hasta antes de la coma
3. No incluyas las comillas ni la coma

### **Mantener Sesión Activa:**

- Los tokens duran **1 hora**
- Si vas a probar por más tiempo, guarda el `refresh_token`
- Usa `POST /auth/refresh` cuando expire

### **Testing Rápido:**

- Mantén una pestaña con Swagger abierta
- Usa el mismo token para múltiples pruebas
- Solo reautoriza cuando cambie el token

---

## 🚀 ¡Listo para Probar!

Ahora tienes todo configurado para probar tu API con autenticación en Swagger.

**Resumen:**

1. ✅ Login → Copiar token
2. ✅ Authorize → Pegar token
3. ✅ Probar endpoints protegidos
4. ✅ ¡Disfrutar! 🎉

---

¿Necesitas ayuda? Revisa la sección de Troubleshooting arriba. 📖
