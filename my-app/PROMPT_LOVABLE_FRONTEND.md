# Sistema de Gestión de Cálculo de Costos Horarios - Aplicación Web

Necesito que crees una aplicación web moderna y profesional para un sistema de gestión de cálculo de costos horarios para maquinaria pesada. La aplicación debe ser responsive, intuitiva y usar React con TypeScript.

## 🎯 **OBJETIVO PRINCIPAL**

Crear una interfaz web que permita gestionar máquinas y realizar cálculos financieros complejos (posesión y costo horario) de manera visual e intuitiva.

## 🏗️ **ARQUITECTURA Y TECNOLOGÍAS**

- **Framework**: React 18+ con TypeScript
- **Styling**: Tailwind CSS con componentes personalizados
- **State Management**: Zustand o React Query para estado global
- **UI Components**: Shadcn/ui o similar (componentes modernos)
- **Icons**: Lucide React
- **Charts**: Recharts para gráficos y visualizaciones
- **Forms**: React Hook Form con Zod para validación
- **API**: Axios para comunicación con backend NestJS

## 📱 **DISEÑO UX/UI**

### **Paleta de Colores**

- **Primary**: Azul corporativo (#1e40af, #3b82f6)
- **Secondary**: Gris moderno (#64748b, #94a3b8)
- **Success**: Verde (#10b981)
- **Warning**: Amarillo (#f59e0b)
- **Error**: Rojo (#ef4444)
- **Background**: Blanco/Gris claro (#f8fafc, #ffffff)

### **Tipografía**

- **Headings**: Inter Bold (H1: 2.5rem, H2: 2rem, H3: 1.5rem)
- **Body**: Inter Regular (1rem)
- **Small**: Inter Medium (0.875rem)

## 🗂️ **ESTRUCTURA DE NAVEGACIÓN**

### **Sidebar Navigation**

```
📊 Dashboard (Home)
🏭 Gestión de Activos
  ├── 🚛 Máquinas
  ├── 🏷️ Modelos
  ├── 🏢 Marcas
  └── ⚙️ Componentes
📈 Cálculos Financieros
  ├── 📋 Cálculo de Posesión
  ├── 💰 Informe Costo Horario
  └── 📊 Historial de Cálculos
📊 Reportes y Análisis
⚙️ Configuración
```

## 🎨 **WIREFRAMES Y COMPONENTES PRINCIPALES**

### 1. **DASHBOARD (Página Principal)**

```
┌─────────────────────────────────────────────────┐
│ Header: Logo + Usuario + Notificaciones         │
├─────────────────────────────────────────────────┤
│ Sidebar │ KPI Cards Row:                        │
│         │ [Total Máquinas][Cálculos Mes]       │
│ Nav     │ [Valor Activos][Rentabilidad Prom]   │
│ Menu    │                                       │
│         │ Charts Row:                           │
│         │ [Gráfico Costos] [Top 5 Máquinas]    │
│         │                                       │
│         │ Recientes:                            │
│         │ [Tabla Últimos Cálculos]             │
└─────────┴─────────────────────────────────────────┘
```

### 2. **GESTIÓN DE MÁQUINAS**

```
┌─────────────────────────────────────────────────┐
│ Header + Breadcrumb: Home > Máquinas           │
├─────────────────────────────────────────────────┤
│ Toolbar:                                       │
│ [+ Nueva Máquina] [Filtros ▼] [Exportar] [🔍] │
├─────────────────────────────────────────────────┤
│ Tabla de Máquinas:                             │
│ ID | Equipo | Marca | Modelo | Estado | Valor │
│ 1  | Drill  | CAT   | 320D   | Activo | $150K │
│ 2  | Truck  | FORD  | F-150  | Mant.  | $80K  │
│                                      [Ver][Edit] │
└─────────────────────────────────────────────────┘
```

### 3. **FORMULARIO CÁLCULO DE POSESIÓN**

```
┌─────────────────────────────────────────────────┐
│ Cálculo de Posesión - Nueva Simulación         │
├─────────────────────────────────────────────────┤
│ Step 1: Selección de Máquina                   │
│ [Dropdown: Seleccionar Máquina ▼]              │
│                                                 │
│ Step 2: Escenarios de Operación                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Escenario 1:                                │ │
│ │ Horas Mín/Mes: [___] Operatividad: [___]   │ │
│ │ Factor Mercado: [___]                       │ │
│ │ [+ Agregar Escenario] [- Quitar]           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Vista Previa] [Calcular y Guardar]            │
└─────────────────────────────────────────────────┘
```

### 4. **RESULTADOS CÁLCULO POSESIÓN**

```
┌─────────────────────────────────────────────────┐
│ Resultados: Máquina CAT 320D                   │
├─────────────────────────────────────────────────┤
│ Gráfico de Depreciación:                       │
│ ┌─────────────────────────────────────────────┐ │
│ │     Valor ($)                               │ │
│ │ 150K│\                                      │ │
│ │ 100K│ \___                                  │ │
│ │  50K│     \___                              │ │
│ │   0 │_________\___                          │ │
│ │     0   5   10  15  Años                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Tabla Resultados por Escenario:                │
│ Hrs | V.Comercial | Depreciación | Vida Útil   │
│ 200 | $95,000     | $55,000      | 12.5 años   │
│ 250 | $87,000     | $63,000      | 10 años     │
│                                                 │
│ [Exportar PDF] [Generar Costo Horario]         │
└─────────────────────────────────────────────────┘
```

### 5. **FORMULARIO INFORME COSTO HORARIO**

```
┌─────────────────────────────────────────────────┐
│ Informe de Costo Horario                       │
├─────────────────────────────────────────────────┤
│ Datos Base:                                     │
│ Máquina: [Dropdown ▼] Posesión: [Dropdown ▼]  │
│                                                 │
│ Parámetros Financieros:                         │
│ ┌─────────────────┬─────────────────────────┐   │
│ │ Tasa Financ.:   │ [___] %                 │   │
│ │ Años Financ.:   │ [___] años              │   │
│ │ Tasa Seguro:    │ [___] %                 │   │
│ │ Meses/Año:      │ [12] meses              │   │
│ └─────────────────┴─────────────────────────┘   │
│                                                 │
│ Costos Variables:                               │
│ Mantenimiento Correctivo: [___] USD/hr          │
│                                                 │
│ [Vista Previa] [Generar Informe]                │
└─────────────────────────────────────────────────┘
```

### 6. **DASHBOARD COSTO HORARIO**

```
┌─────────────────────────────────────────────────┐
│ Resumen de Costos - CAT 320D                   │
├─────────────────────────────────────────────────┤
│ Breakdown de Costos:                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Posesión (60%): ████████████████████        │ │
│ │ Mantenimiento (25%): ████████                │ │
│ │ Operación (15%): ████                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Tabla de Costos Detallados:                    │
│ Concepto         | USD/Hr | % Total             │
│ Depreciación     | $37.43 | 18.7%               │
│ Financiamiento   | $9.36  | 4.7%                │
│ Seguro           | $109   | 54.5%               │
│ Mantenimiento    | $35.2  | 17.6%               │
│ MOTec            | $8.8   | 4.4%                │
│ TOTAL            | $199.8 | 100%                │
│                                                 │
│ [Exportar] [Nueva Simulación] [Historial]      │
└─────────────────────────────────────────────────┘
```

## 🔧 **FUNCIONALIDADES ESPECÍFICAS**

### **Gestión de Máquinas**

- CRUD completo con formularios modales elegantes
- Filtros avanzados (marca, modelo, estado, rango de valor)
- Vista de tarjetas o tabla intercambiable
- Importación masiva desde Excel/CSV
- Exportación a PDF/Excel

### **Cálculo de Posesión**

- Wizard multi-paso intuitivo
- Validación en tiempo real
- Vista previa antes de guardar
- Múltiples escenarios dinámicos
- Visualización gráfica de resultados
- Comparación entre escenarios

### **Informe Costo Horario**

- Selector inteligente máquina → posesión
- Parámetros con valores predeterminados inteligentes
- Cálculo en tiempo real con preview
- Dashboard visual de breakdown de costos
- Gráficos interactivos (pie, bar, line charts)
- Exportación profesional a PDF

### **Historial y Reportes**

- Timeline de cálculos realizados
- Filtros por fecha, máquina, usuario
- Comparación de cálculos históricos
- Análisis de tendencias
- Alertas de variaciones significativas

## 📊 **COMPONENTES DE VISUALIZACIÓN**

### **KPI Cards**

```tsx
<KPICard
  title="Total Máquinas"
  value={150}
  change="+12%"
  trend="up"
  icon={<Truck />}
  color="blue"
/>
```

### **Charts Requeridos**

- **Line Chart**: Evolución de costos en el tiempo
- **Bar Chart**: Comparación entre máquinas
- **Pie Chart**: Breakdown de costos por categoría
- **Area Chart**: Proyección de depreciación

### **Data Tables**

- Sorting en todas las columnas
- Pagination inteligente
- Búsqueda global y por columna
- Acciones inline (ver, editar, eliminar)
- Selección múltiple para acciones masivas

## 🎛️ **INTERACCIONES UX**

### **Loading States**

- Skeleton loading para tablas
- Spinner para cálculos complejos
- Progress bar para wizard multi-paso

### **Error Handling**

- Toast notifications elegantes
- Error boundaries
- Validación de formularios en tiempo real
- Mensajes de error contextuales

### **Success States**

- Confirmaciones con animaciones sutiles
- Success toasts con acciones adicionales
- Auto-navegación después de crear registros

## 📱 **RESPONSIVE DESIGN**

### **Desktop (>1024px)**

- Sidebar fijo
- Tablas completas
- Charts de tamaño completo
- Multi-columna layouts

### **Tablet (768-1024px)**

- Sidebar colapsible
- Tablas con scroll horizontal
- Charts adaptados
- Layout de 2 columnas

### **Mobile (< 768px)**

- Drawer navigation
- Vista de tarjetas en lugar de tablas
- Charts simplificados
- Layout de 1 columna
- Formularios stack verticalmente

## 🔍 **FEATURES ADICIONALES**

### **Búsqueda Global**

- Search bar en header
- Resultados categorizados
- Navegación directa a registros

### **Configuración de Usuario**

- Tema claro/oscuro
- Personalización de dashboard
- Preferencias de exportación
- Configuración de notificaciones

### **Validaciones Inteligentes**

- Validación de rangos financieros realistas
- Alertas de valores atípicos
- Sugerencias basadas en histórico
- Validación cruzada entre campos relacionados

## 🎨 **DETALLES DE ESTILO**

### **Animations**

- Micro-animations con Framer Motion
- Hover effects sutiles
- Loading animations suaves
- Page transitions fluidas

### **Shadows & Borders**

- Cards con shadow-lg
- Borders redondeados (rounded-lg)
- Hover states con shadow-xl

### **Spacing**

- Sistema consistente (4, 8, 16, 24, 32px)
- Padding generoso en forms
- Margin consistente entre secciones

## 📋 **ESTRUCTURA DE DATOS DEL BACKEND**

### **Endpoints Principales**

#### **Máquinas**

```typescript
GET    /machines           // Listar todas las máquinas
POST   /machines           // Crear nueva máquina
GET    /machines/:id       // Obtener máquina específica
PUT    /machines/:id       // Actualizar máquina
DELETE /machines/:id       // Eliminar máquina
GET    /machines/statistics // Estadísticas generales
```

#### **Cálculo de Posesión**

```typescript
POST /calculos/posesion          // Calcular y guardar
POST /calculos/posesion/preview  // Vista previa (sin guardar)
GET  /calculos/posesion/machine/:machineId // Historial por máquina
GET  /calculos/posesion/:id      // Registro específico
```

#### **Informe Costo Horario**

```typescript
POST /calculos/informe-costo-horario          // Calcular y guardar
POST /calculos/informe-costo-horario/preview  // Vista previa
GET  /calculos/informe-costo-horario/machine/:machineId // Historial
GET  /calculos/informe-costo-horario/:id      // Registro específico
GET  /calculos/informe-costo-horario/resumen/:historialId // Resumen
```

### **Tipos de Datos Clave**

#### **Máquina**

```typescript
interface Machine {
  id: number;
  modelo_id?: number;
  estado?: string;
  horometro_inicial?: number;
  valor_similar_nuevo?: number;
  valor_venta?: number;
  vida_util?: number;
  modelo?: {
    id: number;
    nombre: string;
    marca: { id: number; nombre: string };
    equipo: { id: number; nombre: string };
  };
}
```

#### **Cálculo de Posesión**

```typescript
interface CalculoPosesion {
  machine_id: number;
  horas_json: {
    escenarios: Array<{
      horasMinimas: number;
      gradoDeOperatividad: number; // 0-1
      factorDeMercado: number; // 0-2
    }>;
  };
  comentario?: string;
  usuario_id?: string;
}
```

#### **Informe Costo Horario**

```typescript
interface InformeCostoHorario {
  machineId: number;
  posesionId: number;
  mesesPorAnio?: number; // default: 12
  tasaFinanciamiento?: number; // default: 0.09
  aniosFinanciamiento?: number; // default: 3
  tasaSeguro?: number; // default: 0.01
  aniosSeguro?: number; // default: 1
  comentario?: string;
  usuarioId?: string;
  incluyeGastosDistribuibles?: boolean; // default: false
  costoMCorrMayores?: number; // default: 0
}
```

## 🚀 **CASOS DE USO PRINCIPALES**

### **Flujo 1: Gestión de Máquinas**

1. Usuario accede a sección "Máquinas"
2. Ve listado con filtros y búsqueda
3. Puede crear nueva máquina con formulario modal
4. Edita máquinas existentes
5. Ve detalles completos de cada máquina

### **Flujo 2: Cálculo de Posesión**

1. Usuario selecciona "Cálculo de Posesión"
2. Elige máquina del dropdown
3. Define múltiples escenarios (horas, operatividad, factor mercado)
4. Ve vista previa de cálculos
5. Guarda resultado y ve visualización gráfica
6. Puede exportar o usar para costo horario

### **Flujo 3: Informe Costo Horario**

1. Usuario selecciona "Informe Costo Horario"
2. Elige máquina y registro de posesión relacionado
3. Configura parámetros financieros (tasas, años, etc.)
4. Define costos variables adicionales
5. Ve preview de breakdown de costos
6. Genera informe final con gráficos
7. Exporta a PDF o guarda en historial

### **Flujo 4: Análisis y Reportes**

1. Usuario accede a historial de cálculos
2. Filtra por máquina, fecha o tipo
3. Compara diferentes cálculos
4. Ve análisis de tendencias
5. Exporta reportes consolidados

## 🎯 **MÉTRICAS DE ÉXITO UX**

### **Usabilidad**

- Tiempo para completar un cálculo: < 3 minutos
- Tasa de error en formularios: < 5%
- Satisfacción del usuario: > 4.5/5

### **Performance**

- Tiempo de carga inicial: < 2 segundos
- Tiempo de respuesta de cálculos: < 5 segundos
- Renderizado de gráficos: < 1 segundo

### **Adopción**

- Onboarding completado: > 90%
- Uso recurrente semanal: > 70%
- Features utilizadas: > 80% de funcionalidades

---

**NOTA IMPORTANTE**: Esta aplicación debe sentirse como software empresarial de alta calidad, con atención al detalle en cada interacción y una experiencia de usuario que refleje la complejidad y precisión de los cálculos financieros que maneja.
