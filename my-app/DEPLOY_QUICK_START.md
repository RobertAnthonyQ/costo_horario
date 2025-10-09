# 🚀 DEPLOY RÁPIDO EN RENDER

## Pasos Resumidos (5 minutos)

### 1️⃣ Sube tu código a GitHub

```bash
git add .
git commit -m "Preparar para Render"
git push origin dev
```

### 2️⃣ Ve a Render.com

👉 **https://render.com** → Sign up with GitHub

### 3️⃣ Deploy BACKEND

1. New + → **Web Service**
2. Conecta: `RobertAnthonyQ/costo_horario`
3. Rama: `dev`
4. **Build Command**:
   ```
   npm install && cd apps/backend && npm install && npm run build
   ```
5. **Start Command**:
   ```
   cd apps/backend && npm run start:prod
   ```
6. **Environment Variables** (copia del archivo `.env`):
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres.rzlumyniosraujfymybw:peluchina.113@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.rzlumyniosraujfymybw:peluchina.113@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   SUPABASE_URL=https://rzlumyniosraujfymybw.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDc4MjQsImV4cCI6MjA3Mjc4MzgyNH0.db5JkK9DI8qrvOusGttE2LKxBjI5nXk-bdZN86IwCHk
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIwNzgyNCwiZXhwIjoyMDcyNzgzODI0fQ.Vj1eIGCpAN_0NjGl5vRJA51raKqAZ8tFLkbixi16Qcg
   ```
7. **Create Web Service** → Espera 5-10 min
8. **COPIA LA URL**: `https://costo-horario-backend.onrender.com`

### 4️⃣ Deploy FRONTEND

1. New + → **Static Site**
2. Mismo repo: `RobertAnthonyQ/costo_horario`
3. Rama: `dev`
4. **Build Command**:
   ```
   npm install && cd apps/frontend && npm install && npm run build
   ```
5. **Publish Directory**:
   ```
   apps/frontend/dist
   ```
6. **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://rzlumyniosraujfymybw.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHVteW5pb3NyYXVqZnlteWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDc4MjQsImV4cCI6MjA3Mjc4MzgyNH0.db5JkK9DI8qrvOusGttE2LKxBjI5nXk-bdZN86IwCHk
   VITE_SUPABASE_BUCKET=machines-images
   VITE_API_URL=https://costo-horario-backend.onrender.com
   ```
   ⚠️ **Usa la URL del backend del paso 3.8**
7. **Create Static Site** → Espera 3-5 min

### 5️⃣ ¡Listo! 🎉

**URLs Finales:**

- 🎨 Frontend: `https://costo-horario-frontend.onrender.com`
- 🔧 Backend: `https://costo-horario-backend.onrender.com`

---

## ⚠️ IMPORTANTE: Plan FREE

- ❌ Backend se duerme tras 15 min inactivo
- ⏱️ Tarda ~50 seg en despertar
- ✅ Frontend siempre activo

**Solución:** Usa cron-job.org para hacer ping cada 10 min

---

## 📚 Guía Completa

Para más detalles, errores comunes y troubleshooting:
👉 Ver: **DEPLOYMENT_RENDER_GUIDE.md**

---

## 🐛 Problemas Comunes

### Build falla

- Verifica que `package.json` tenga los scripts `build` y `start:prod`

### Frontend no conecta

- Verifica `VITE_API_URL` en variables de entorno
- Verifica CORS en backend (ya configurado ✅)

### Base de datos no conecta

- Verifica `DATABASE_URL` y `DIRECT_URL`
- Verifica que Supabase esté activo

---

**¿Necesitas ayuda?** Revisa los logs en el Dashboard de Render
