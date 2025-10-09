# 🔐 Módulo de Autenticación - Backend

Sistema completo de autenticación usando **Supabase Auth** y **NestJS**.

## ⚙️ IMPORTANTE: Configuración Simplificada

- ✅ **Sin verificación de email** - Login inmediato después del registro
- ✅ **Contraseñas simples** - Mínimo 3 caracteres, solo minúsculas
- 📖 **Ver configuración completa en:** `apps/backend/CONFIGURACION_AUTH.md`

## 📁 Estructura del Módulo

```
src/modules/auth/
├── dto/
│   ├── login.dto.ts              # DTO para login
│   ├── register.dto.ts           # DTO para registro
│   ├── reset-password.dto.ts     # DTO para recuperación
│   ├── auth-response.dto.ts      # DTO de respuesta estándar
│   └── index.ts
├── guards/
│   ├── auth.guard.ts             # Guard de autenticación global
│   └── index.ts
├── decorators/
│   ├── public.decorator.ts       # @Public() para rutas sin auth
│   ├── current-user.decorator.ts # @CurrentUser() para obtener usuario
│   └── index.ts
├── auth.service.ts               # Lógica de autenticación
├── auth.controller.ts            # Endpoints REST
├── auth.module.ts                # Módulo de autenticación
└── index.ts
```

## 🚀 Endpoints Disponibles

### 1. **POST** `/auth/register` (Público)

Registra un nuevo usuario en el sistema.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "abc",
  "full_name": "Juan Pérez",
  "avatar_url": "https://ejemplo.com/avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Ya puedes iniciar sesión.",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Juan Pérez",
    "avatar_url": "https://ejemplo.com/avatar.jpg",
    "created_at": "2025-01-10T12:00:00Z"
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

### 2. **POST** `/auth/login` (Público)

Inicia sesión con email y contraseña.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "abc"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Juan Pérez",
    "avatar_url": "https://ejemplo.com/avatar.jpg",
    "created_at": "2025-01-10T12:00:00Z"
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

### 3. **POST** `/auth/logout` (Protegido)

Cierra la sesión actual.

**Headers:**

```
Authorization: Bearer eyJhbGci...
```

**Response:**

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 4. **GET** `/auth/me` (Protegido)

Obtiene información del usuario autenticado.

**Headers:**

```
Authorization: Bearer eyJhbGci...
```

**Response:**

```json
{
  "success": true,
  "message": "Usuario obtenido exitosamente",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Juan Pérez",
    "avatar_url": "https://ejemplo.com/avatar.jpg",
    "created_at": "2025-01-10T12:00:00Z"
  }
}
```

---

### 5. **POST** `/auth/refresh` (Público)

Refresca el access token usando el refresh token.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGci..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sesión refrescada exitosamente",
  "session": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 3600,
    "expires_at": 1736514000
  }
}
```

---

### 6. **POST** `/auth/reset-password` (Público)

Solicita recuperación de contraseña.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Si el email existe, recibirás un enlace para restablecer tu contraseña"
}
```

---

## 🔒 Protección de Rutas

### AuthGuard Global

El `AuthGuard` se aplica **globalmente** a todas las rutas. Para hacer una ruta pública, usa el decorator `@Public()`.

### Rutas Protegidas (por defecto)

```typescript
@Controller('componentes')
export class ComponentesController {
  // ✅ Esta ruta requiere autenticación automáticamente
  @Get()
  findAll() {
    return this.componentesService.findAll();
  }
}
```

### Rutas Públicas

```typescript
import { Public } from '@/modules/auth/decorators';

@Controller('auth')
export class AuthController {
  // ✅ Esta ruta NO requiere autenticación
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }
}
```

---

## 👤 Obtener Usuario Actual

Usa el decorator `@CurrentUser()` para obtener el usuario autenticado en cualquier endpoint:

```typescript
import { CurrentUser } from '@/modules/auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: User) {
    return {
      message: `Hola ${user.email}`,
      userId: user.id,
    };
  }
}
```

---

## 🧪 Testing con Swagger

Accede a la documentación interactiva en:

```
http://localhost:3000/api/docs
```

### Cómo autenticarte en Swagger:

1. Haz login en `/auth/login`
2. Copia el `access_token` de la respuesta
3. Click en el botón **"Authorize"** 🔒 en Swagger
4. Pega el token en el campo: `Bearer eyJhbGci...`
5. Todas las rutas protegidas funcionarán automáticamente

---

## 📝 Flujo de Autenticación

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ 1. POST /auth/login
       ▼
┌─────────────────────┐
│  AuthController     │
│  (NestJS)           │
└──────┬──────────────┘
       │ 2. authService.signIn()
       ▼
┌─────────────────────┐
│  AuthService        │
│  Valida con Supabase│
└──────┬──────────────┘
       │ 3. supabase.auth.signInWithPassword()
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  Genera JWT         │
└──────┬──────────────┘
       │ 4. Retorna { user, session }
       ▼
┌─────────────────────┐
│  Cliente            │
│  Guarda tokens      │
└─────────────────────┘
```

---

## 🔐 Requests Subsecuentes

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ 1. GET /componentes
       │    Headers: Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│  AuthGuard          │
│  (Global)           │
└──────┬──────────────┘
       │ 2. Verifica token con Supabase
       │ 3. Adjunta user a request
       ▼
┌─────────────────────┐
│  ComponentesController│
│  request.user disponible│
└──────┬──────────────┘
       │ 4. Ejecuta lógica
       ▼
┌─────────────────────┐
│  Response           │
└─────────────────────┘
```

---

## ⚙️ Variables de Entorno Requeridas

```bash
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Frontend URL (para reset password)
FRONTEND_URL=http://localhost:5173

# App Configuration
PORT=3000
NODE_ENV=development
```

---

## 🛡️ Seguridad

### Buenas Prácticas Implementadas:

- ✅ **JWT firmado por Supabase** (no manipulable)
- ✅ **Tokens de corta duración** (1 hora por defecto)
- ✅ **Refresh tokens** para renovar sesión
- ✅ **Validación de DTOs** con `class-validator`
- ✅ **Row Level Security (RLS)** en Supabase
- ✅ **Service Role Key** solo en backend (nunca expuesto)
- ✅ **Logging de eventos** de autenticación
- ✅ **Manejo de errores** consistente

### ⚠️ Consideraciones:

- El `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe exponerse al frontend
- Los tokens expiran automáticamente
- Supabase maneja el hash de contraseñas con bcrypt
- Se debe configurar **RLS policies** en las tablas de Supabase

---

## 📚 Próximos Pasos

### Opcional - Mejoras Adicionales:

1. **Roles y Permisos**: Agregar `@Roles()` decorator
2. **Rate Limiting**: Limitar intentos de login
3. **MFA (2FA)**: Autenticación de dos factores
4. **OAuth Providers**: Login con Google, GitHub, etc.
5. **Session Management**: Ver sesiones activas del usuario
6. **Audit Log**: Registrar accesos y cambios

---

## 🐛 Troubleshooting

### Error: "Token inválido o expirado"

- Verifica que el token esté en el header: `Authorization: Bearer <token>`
- Verifica que el token no haya expirado (1 hora por defecto)
- Usa `/auth/refresh` para obtener un nuevo token

### Error: "Email ya existe"

- El usuario ya está registrado
- Usa `/auth/login` en su lugar

### Error: "Credenciales inválidas"

- Email o contraseña incorrectos
- Verifica que el usuario haya confirmado su email

### No puedo acceder a ninguna ruta

- Todas las rutas están protegidas por defecto
- Asegúrate de agregar `@Public()` a las rutas que no requieren auth
- Verifica que estés enviando el token en el header

---

## 📖 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

✅ **¡El módulo de autenticación está listo para usar!** 🚀
