# ✅ CHECKLIST DE DEPLOYMENT EN RENDER

## Antes de Empezar

- [ ] Código subido a GitHub
- [ ] Cuenta en Render.com creada
- [ ] Variables de entorno preparadas (.env)
- [ ] Supabase funcionando

---

## 🔧 BACKEND (5-10 min)

### Configuración Inicial

- [ ] New + → Web Service
- [ ] Conectar repo: `RobertAnthonyQ/costo_horario`
- [ ] Rama: `dev`
- [ ] Runtime: `Node`
- [ ] Plan: `Free`

### Build & Start

- [ ] Build Command: `npm install && cd apps/backend && npm install && npm run build`
- [ ] Start Command: `cd apps/backend && npm run start:prod`

### Variables de Entorno (8 variables)

- [ ] `NODE_ENV` = production
- [ ] `PORT` = 3000
- [ ] `DATABASE_URL` = (de Supabase)
- [ ] `DIRECT_URL` = (de Supabase)
- [ ] `SUPABASE_URL` = (de Supabase)
- [ ] `SUPABASE_ANON_KEY` = (de Supabase)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (de Supabase)
- [ ] `VITE_SUPABASE_BUCKET` = machines-images

### Deploy

- [ ] Click "Create Web Service"
- [ ] Esperar build (5-10 min)
- [ ] Verificar logs: sin errores
- [ ] Copiar URL: `https://________.onrender.com`
- [ ] Probar: Abrir URL en navegador

---

## 🎨 FRONTEND (3-5 min)

### Configuración Inicial

- [ ] New + → Static Site
- [ ] Mismo repo: `RobertAnthonyQ/costo_horario`
- [ ] Rama: `dev`
- [ ] Plan: `Free`

### Build & Publish

- [ ] Build Command: `npm install && cd apps/frontend && npm install && npm run build`
- [ ] Publish Directory: `apps/frontend/dist`

### Variables de Entorno (4 variables)

- [ ] `VITE_SUPABASE_URL` = (de Supabase)
- [ ] `VITE_SUPABASE_ANON_KEY` = (de Supabase)
- [ ] `VITE_SUPABASE_BUCKET` = machines-images
- [ ] `VITE_API_URL` = (URL del backend)

### Deploy

- [ ] Click "Create Static Site"
- [ ] Esperar build (3-5 min)
- [ ] Verificar logs: sin errores
- [ ] Copiar URL: `https://________.onrender.com`
- [ ] Probar: Abrir URL en navegador

---

## 🧪 VERIFICACIÓN FINAL

### Backend

- [ ] URL abre sin error 500
- [ ] Swagger docs disponible: `/api/docs`
- [ ] Endpoint de prueba funciona: `/machines`

### Frontend

- [ ] Aplicación carga correctamente
- [ ] No hay errores en consola del navegador (F12)
- [ ] Puede conectarse al backend (prueba listar máquinas)

### Base de Datos

- [ ] Backend conecta a Supabase
- [ ] Datos se muestran en el frontend
- [ ] CRUD funciona (crear, leer, actualizar, eliminar)

---

## 🎯 URLs FINALES

Anota aquí tus URLs:

```
Frontend:  https://________________________.onrender.com
Backend:   https://________________________.onrender.com
Supabase:  https://rzlumyniosraujfymybw.supabase.co
Swagger:   https://________________________.onrender.com/api/docs
```

---

## 🎉 POST-DEPLOYMENT

- [ ] Compartir URL del frontend
- [ ] Configurar dominio personalizado (opcional)
- [ ] Configurar cron-job para evitar sleep (opcional)
- [ ] Monitorear logs los primeros días
- [ ] Hacer backup de la base de datos

---

## 🆘 EN CASO DE ERRORES

1. **Build falla**: Revisar logs en Render
2. **No conecta a DB**: Verificar DATABASE_URL
3. **CORS errors**: Ya está configurado, verificar URL del frontend
4. **500 errors**: Revisar logs del backend
5. **404 en frontend**: Verificar Publish Directory

---

**Tiempo total estimado**: 15-20 minutos
**Costo**: $0/mes (plan free)
**Próximo paso**: Monitorear performance y considerar upgrade si es necesario

---

✅ = Completado
⏳ = En proceso
❌ = Pendiente/Error
