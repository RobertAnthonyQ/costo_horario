# 🚀 Guía de Deployment en Render

Esta guía te llevará paso a paso para desplegar tu aplicación Turborepo en Render.

## 📋 Prerrequisitos

- [ ] Cuenta en GitHub con tu código subido
- [ ] Cuenta en Render.com (gratis)
- [ ] Base de datos Supabase configurada (✅ Ya la tienes)
- [ ] Variables de entorno listas

---

## 🎯 PASO 1: Preparar tu Repositorio en GitHub

### 1.1 Verifica que tu código esté subido

```bash
# En tu terminal local
cd D:\SOLO\CARLOS\my-app
git status
git add .
git commit -m "Preparar para deploy en Render"
git push origin dev
```

### 1.2 Asegúrate de que estos archivos existan:

- ✅ `render.yaml` (ya creado)
- ✅ `.env.example` (ya creado)
- ✅ `apps/backend/package.json`
- ✅ `apps/frontend/package.json`

---

## 🚀 PASO 2: Crear cuenta en Render

1. Ve a **https://render.com**
2. Haz clic en **"Get Started for Free"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Render para acceder a tus repositorios

---

## 🔧 PASO 3: Desplegar el BACKEND (NestJS)

### 3.1 Crear el servicio

1. En el Dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio: **RobertAnthonyQ/costo_horario**
4. Selecciona la rama: **dev**

### 3.2 Configurar el servicio

**Name:** `costo-horario-backend`

**Region:** Oregon (US West)

**Branch:** `dev`

**Root Directory:** (dejar vacío)

**Runtime:** `Node`

**Build Command:**

```bash
npm install && cd apps/backend && npm install && npm run build
```

**Start Command:**

```bash
cd apps/backend && npm run start:prod
```

**Plan:** `Free`

### 3.3 Configurar Variables de Entorno

Haz clic en **"Advanced"** y luego **"Add Environment Variable"**

Agrega las siguientes variables:

```
NODE_ENV = production
PORT = 3000
DATABASE_URL = postgresql://postgres.rzlumyniosraujfymybw:peluchina.113@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL = postgresql://postgres.rzlumyniosraujfymybw:peluchina.113@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL = https://rzlumyniosraujfymybw.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDc4MjQsImV4cCI6MjA3Mjc4MzgyNH0.db5JkK9DI8qrvOusGttE2LKxBjI5nXk-bdZN86IwCHk
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIwNzgyNCwiZXhwIjoyMDcyNzgzODI0fQ.Vj1eIGCpAN_0NjGl5vRJA51raKqAZ8tFLkbixi16Qcg
VITE_SUPABASE_BUCKET = machines-images
```

### 3.4 Desplegar

1. Haz clic en **"Create Web Service"**
2. Espera 5-10 minutos mientras se construye
3. Verás logs en tiempo real
4. Cuando termine, verás: **"Your service is live 🎉"**
5. **COPIA LA URL**: `https://costo-horario-backend.onrender.com`

⚠️ **IMPORTANTE**: Guarda esta URL, la necesitarás para el frontend.

---

## 🎨 PASO 4: Desplegar el FRONTEND (React + Vite)

### 4.1 Crear el servicio

1. En el Dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Static Site"**
3. Conecta el mismo repositorio: **RobertAnthonyQ/costo_horario**
4. Selecciona la rama: **dev**

### 4.2 Configurar el servicio

**Name:** `costo-horario-frontend`

**Branch:** `dev`

**Root Directory:** (dejar vacío)

**Build Command:**

```bash
npm install && cd apps/frontend && npm install && npm run build
```

**Publish Directory:**

```
apps/frontend/dist
```

### 4.3 Configurar Variables de Entorno

Haz clic en **"Advanced"** y agrega:

```
VITE_SUPABASE_URL = https://rzlumyniosraujfymybw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDc4MjQsImV4cCI6MjA3Mjc4MzgyNH0.db5JkK9DI8qrvOusGttE2LKxBjI5nXk-bdZN86IwCHk
VITE_SUPABASE_BUCKET = machines-images
VITE_API_URL = https://costo-horario-backend.onrender.com
```

⚠️ **Reemplaza** `VITE_API_URL` con la URL real de tu backend del Paso 3.4

### 4.4 Desplegar

1. Haz clic en **"Create Static Site"**
2. Espera 3-5 minutos
3. Tu frontend estará listo en: `https://costo-horario-frontend.onrender.com`

---

## 🌐 PASO 5: Configurar CORS en el Backend

El frontend necesita hacer peticiones al backend, así que debemos permitir CORS.

### 5.1 Actualizar archivo main.ts del backend

El archivo ya debería tener configuración CORS, pero verifica:

```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: [
    "http://localhost:5173",
    "https://costo-horario-frontend.onrender.com", // Tu URL del frontend
  ],
  credentials: true,
});
```

### 5.2 Hacer commit y push

```bash
git add apps/backend/src/main.ts
git commit -m "Configurar CORS para Render"
git push origin dev
```

Render detectará el cambio y reconstruirá automáticamente el backend.

---

## ✅ PASO 6: Verificar el Deployment

### 6.1 Verificar Backend

1. Ve a: `https://costo-horario-backend.onrender.com`
2. Deberías ver un mensaje o respuesta JSON
3. Prueba un endpoint: `https://costo-horario-backend.onrender.com/machines`

### 6.2 Verificar Frontend

1. Ve a: `https://costo-horario-frontend.onrender.com`
2. Deberías ver tu aplicación cargando
3. Prueba crear/ver máquinas

---

## ⚠️ LIMITACIONES DEL PLAN FREE

### Backend (Web Service Free):

- ❌ Se duerme después de **15 minutos** de inactividad
- ⏱️ Tarda **~50 segundos** en despertar (cold start)
- ✅ 750 horas/mes de uptime gratis
- 🔄 Se reinicia automáticamente cada mes

### Frontend (Static Site):

- ✅ **Siempre activo** (no se duerme)
- ✅ Bandwidth ilimitado
- ✅ CDN incluido
- ✅ Deploy automático con cada push

---

## 🎯 SIGUIENTE PASO: Mejorar Performance

### Opción 1: Upgrade a Paid ($7/mes)

- Sin cold starts
- Backend siempre activo
- Mejor para producción

### Opción 2: Usar Cron Jobs (Free)

Mantén tu backend despierto con un ping cada 10 minutos:

1. Ve a **cron-job.org** (gratis)
2. Crea un job que haga GET a: `https://costo-horario-backend.onrender.com`
3. Configura cada 10 minutos
4. ¡Tu backend nunca se dormirá!

---

## 🐛 TROUBLESHOOTING

### Problema: Build falla en el backend

**Solución:**

```bash
# Verifica que el script existe en apps/backend/package.json
"scripts": {
  "build": "nest build",
  "start:prod": "node dist/main"
}
```

### Problema: Frontend no se conecta al backend

**Soluciones:**

1. Verifica `VITE_API_URL` en variables de entorno del frontend
2. Verifica CORS en `apps/backend/src/main.ts`
3. Revisa los logs del backend en Render

### Problema: "Module not found" errors

**Solución:**

```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

---

## 📊 URLS FINALES

Después del deployment, tendrás:

- 🎨 **Frontend**: `https://costo-horario-frontend.onrender.com`
- 🔧 **Backend**: `https://costo-horario-backend.onrender.com`
- 💾 **Database**: Supabase (ya configurado)

---

## 🎉 ¡LISTO!

Tu aplicación ya está en producción. Ahora puedes:

1. Compartir el link del frontend con usuarios
2. Configurar un dominio personalizado (opcional)
3. Monitorear logs en el dashboard de Render
4. Ver métricas de uso

---

## 💡 TIPS ADICIONALES

### Auto-Deploy

Render hace deploy automático con cada `git push` a la rama `dev`.

### Ver Logs

- Dashboard → Tu servicio → Logs
- Ver errores en tiempo real

### Rollback

- Dashboard → Tu servicio → Events → "Rollback to ..."

### Custom Domain (Opcional)

- Dashboard → Settings → Custom Domain
- Agrega tu dominio y configura DNS

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Consulta: https://render.com/docs
4. O pregúntame 😊

---

**¡Éxito con tu deployment!** 🚀
