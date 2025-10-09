# 🔐 Configuración de Variables de Entorno

Este proyecto usa archivos `.env` para configurar variables sensibles. Aquí te explico cómo funciona:

## 📁 Estructura de Archivos

```
my-app/
├── .env                          ← Variables GLOBALES (compartidas)
├── .env.example                  ← Template global
└── apps/
    └── backend/
        ├── .env                  ← Variables LOCALES del backend
        └── .env.example          ← Template del backend ✅
```

---

## 🎯 ¿Cuál usar?

### `.env` en la raíz (`my-app/.env`)

**Uso**: Variables compartidas por TODO el monorepo

- Frontend puede acceder a `VITE_*` variables
- Backend puede acceder a todas las variables
- Se carga automáticamente en todo el proyecto

**Ejemplo**:

```env
SUPABASE_URL=https://...
VITE_SUPABASE_URL=https://...
DATABASE_URL=postgresql://...
```

### `.env` en backend (`apps/backend/.env`)

**Uso**: Variables específicas solo del backend

- Solo el backend puede acceder
- Útil para desarrollo aislado del backend
- Sobrescribe variables de la raíz si hay conflicto

**Ejemplo**:

```env
PORT=4000
NODE_ENV=development
```

---

## 🚀 Setup para Desarrollo Local

### 1️⃣ Primera vez (nuevo developer):

```bash
# En la raíz del proyecto
cp .env.example .env

# En el backend
cd apps/backend
cp .env.example .env
```

### 2️⃣ Editar valores reales:

Abre los archivos `.env` y reemplaza los valores de ejemplo con tus credenciales reales:

**`my-app/.env`**:

```env
SUPABASE_URL=https://rzlumyniosraujfymybw.supabase.co
SUPABASE_ANON_KEY=tu_key_real_aqui
DATABASE_URL=postgresql://...tu_conexión_real...
```

**`apps/backend/.env`**:

```env
PORT=4000
NODE_ENV=development
```

---

## 🔒 Seguridad

### ✅ Archivos que SÍ se suben a Git:

- `.env.example` (en la raíz)
- `apps/backend/.env.example`
- Contienen valores de ejemplo (no reales)

### ❌ Archivos que NO se suben a Git:

- `.env` (en la raíz)
- `apps/backend/.env`
- Contienen valores reales (sensibles)
- Están en `.gitignore`

---

## 🌐 Variables para Deployment

### Para Render:

Cuando despliegues en Render, debes agregar estas variables en el Dashboard:

**Backend**:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Frontend**:

```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_BUCKET=machines-images
VITE_API_URL=https://tu-backend.onrender.com
```

---

## 🔍 Cómo obtener tus credenciales

### Supabase:

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `rzlumyniosraujfymybw`
3. **API Keys**:
   - Settings → API → Project URL
   - Settings → API → anon public key
   - Settings → API → service_role key
4. **Database URL**:
   - Settings → Database → Connection string
   - Copia "URI" y "Direct connection"

---

## 🐛 Troubleshooting

### Error: "Environment variables not found"

**Solución**: Verifica que tienes el archivo `.env` en el lugar correcto

### Error: "Cannot connect to database"

**Solución**: Verifica que `DATABASE_URL` y `DIRECT_URL` sean correctos

### Error: "Supabase client error"

**Solución**: Verifica `SUPABASE_URL` y `SUPABASE_ANON_KEY`

### Variables no se cargan

**Solución**:

1. Reinicia el servidor de desarrollo
2. Verifica que el nombre de la variable sea correcto
3. Para frontend, variables deben empezar con `VITE_`

---

## 📝 Nombres de Variables

### Para Backend (accesible desde NestJS):

```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
PORT
NODE_ENV
```

### Para Frontend (accesible desde Vite/React):

```
VITE_SUPABASE_URL          ← Debe empezar con VITE_
VITE_SUPABASE_ANON_KEY     ← Debe empezar con VITE_
VITE_API_URL               ← Debe empezar con VITE_
VITE_SUPABASE_BUCKET       ← Debe empezar con VITE_
```

⚠️ **IMPORTANTE**: Variables para el frontend **DEBEN** empezar con `VITE_`

---

## 💡 Tips

1. **Nunca commitees archivos `.env`** con valores reales
2. **Actualiza `.env.example`** cuando agregues nuevas variables
3. **Usa valores de ejemplo** en `.env.example` (no reales)
4. **Documenta nuevas variables** en este README
5. **Comparte `.env.example`** con el equipo, no `.env`

---

## ✅ Checklist

- [ ] Copié `.env.example` a `.env` en la raíz
- [ ] Copié `apps/backend/.env.example` a `apps/backend/.env`
- [ ] Actualicé los valores reales en ambos `.env`
- [ ] Verifiqué que `.env` está en `.gitignore`
- [ ] No commitearé archivos `.env` con valores reales

---

¿Dudas? Revisa la guía de deployment o pregunta al equipo.
