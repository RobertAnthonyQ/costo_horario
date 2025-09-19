# 📁 Estructura del Frontend - Sistema de Cálculo de Costos Horarios

## 🗂️ **Organización de Carpetas**

### **📱 App Router (Next.js 13+)**

```
apps/web/app/
├── dashboard/                  # 📊 Dashboard principal
├── gestion-activos/           # 🏭 Gestión de Activos
│   ├── maquinas/              # 🚛 CRUD de Máquinas
│   │   ├── [id]/              # Detalle de máquina específica
│   │   └── nueva/             # Crear nueva máquina
│   ├── modelos/               # 🏷️ CRUD de Modelos
│   │   └── [id]/              # Detalle de modelo específico
│   ├── marcas/                # 🏢 CRUD de Marcas
│   │   └── [id]/              # Detalle de marca específica
│   └── componentes/           # ⚙️ CRUD de Componentes
│       └── [id]/              # Detalle de componente específico
├── calculos/                  # 📈 Cálculos Financieros
│   ├── posesion/              # 📋 Cálculo de Posesión
│   │   ├── nueva/             # Nuevo cálculo de posesión
│   │   ├── [id]/              # Ver cálculo específico
│   │   └── resultados/        # Visualización de resultados
│   ├── costo-horario/         # 💰 Informe Costo Horario
│   │   ├── nuevo/             # Nuevo informe costo horario
│   │   ├── [id]/              # Ver informe específico
│   │   └── dashboard/         # Dashboard de breakdown costos
│   └── historial/             # 📊 Historial de todos los cálculos
├── reportes/                  # 📊 Reportes y Análisis
│   └── analisis/              # Análisis de tendencias
└── configuracion/             # ⚙️ Configuración del sistema
```

### **🧩 Componentes Reutilizables**

```
apps/web/components/
├── ui/                        # Componentes base (shadcn/ui style)
├── layout/                    # Componentes de layout (Sidebar, Header, etc.)
├── charts/                    # Componentes de gráficos (Recharts)
├── forms/                     # Componentes de formularios
├── tables/                    # Componentes de tablas interactivas
├── modals/                    # Componentes de modales/dialogs
├── dashboard/                 # Componentes específicos del dashboard
├── maquinas/                  # Componentes específicos de máquinas
└── calculos/                  # Componentes de cálculos
    ├── posesion/              # Componentes específicos de posesión
    └── costo-horario/         # Componentes específicos de costo horario
```

### **🔧 Utilidades y Configuración**

```
apps/web/
├── hooks/                     # Custom React hooks
├── store/                     # Estado global (Zustand)
├── lib/                       # Configuraciones y servicios
├── types/                     # Tipos TypeScript
├── utils/                     # Utilidades y helpers
└── public/                    # Assets estáticos
```

## 🎯 **Propósito de cada Carpeta**

### **📱 Vistas Principales (App Router)**

#### **Dashboard (`/dashboard`)**

- **Propósito**: Página principal con KPIs, gráficos y resumen de actividad
- **Componentes**: KPI Cards, Charts de overview, Últimos cálculos

#### **Gestión de Activos (`/gestion-activos`)**

- **Máquinas**: CRUD completo, filtros, importación/exportación
- **Modelos**: Gestión de modelos de máquinas
- **Marcas**: Gestión de marcas de equipos
- **Componentes**: Gestión de componentes y repuestos

#### **Cálculos (`/calculos`)**

- **Posesión**: Wizard multi-paso, múltiples escenarios, visualización de resultados
- **Costo Horario**: Formularios complejos, dashboard de breakdown, exportación PDF
- **Historial**: Vista consolidada de todos los cálculos realizados

#### **Reportes (`/reportes`)**

- **Análisis**: Comparaciones, tendencias, proyecciones

#### **Configuración (`/configuracion`)**

- **Sistema**: Configuraciones generales, usuarios, preferencias

### **🧩 Componentes Organizados por Funcionalidad**

#### **UI Base (`components/ui`)**

- Componentes atómicos reutilizables
- Siguiendo patrones de shadcn/ui
- Botones, inputs, cards, badges, etc.

#### **Layout (`components/layout`)**

- **Sidebar**: Navegación principal
- **Header**: Barra superior con usuario y notificaciones
- **Breadcrumbs**: Navegación de ubicación

#### **Charts (`components/charts`)**

- **LineChart**: Evolución de costos
- **BarChart**: Comparaciones entre máquinas
- **PieChart**: Breakdown de costos por categoría
- **AreaChart**: Proyecciones de depreciación

#### **Forms (`components/forms`)**

- **MachineForm**: Formulario de máquinas
- **PosesionForm**: Wizard de cálculo de posesión
- **CostoHorarioForm**: Formulario de costo horario
- **Validaciones**: Componentes de validación en tiempo real

#### **Tables (`components/tables`)**

- **DataTable**: Tabla base con sorting, filtros, paginación
- **MachinesTable**: Tabla específica de máquinas
- **HistorialTable**: Tabla de historial de cálculos

#### **Modals (`components/modals`)**

- **CreateMachineModal**: Modal para crear máquina
- **PreviewModal**: Modal de vista previa de cálculos
- **ConfirmModal**: Modal de confirmación de acciones

### **🔧 Utilidades y Servicios**

#### **Hooks (`hooks/`)**

- **useApi**: Hook para llamadas a la API
- **useMachines**: Hook específico para gestión de máquinas
- **useCalculos**: Hook para cálculos financieros

#### **Store (`store/`)**

- **machineStore**: Estado global de máquinas
- **calculoStore**: Estado global de cálculos
- **uiStore**: Estado global de UI (tema, sidebar, etc.)

#### **Lib (`lib/`)**

- **api**: Configuración de Axios y endpoints
- **validations**: Esquemas de validación con Zod
- **utils**: Funciones utilitarias generales

#### **Types (`types/`)**

- **machine.types**: Interfaces de máquinas
- **calculo.types**: Interfaces de cálculos
- **api.types**: Tipos de respuestas de API

## 🚀 **Flujo de Desarrollo Sugerido**

### **Fase 1: Setup Base**

1. Configurar componentes UI base (`components/ui`)
2. Crear layout principal (`components/layout`)
3. Configurar tipos TypeScript (`types/`)

### **Fase 2: Gestión de Máquinas**

1. Vista de listado (`app/gestion-activos/maquinas/page.tsx`)
2. Formulario de creación (`components/maquinas/MachineForm`)
3. Tabla interactiva (`components/tables/MachinesTable`)

### **Fase 3: Dashboard**

1. KPI Cards (`components/dashboard/KPICard`)
2. Charts básicos (`components/charts/`)
3. Vista principal (`app/dashboard/page.tsx`)

### **Fase 4: Cálculos**

1. Formulario de posesión (`app/calculos/posesion/nueva`)
2. Visualización de resultados (`components/calculos/posesion/`)
3. Formulario de costo horario (`app/calculos/costo-horario/nuevo`)

### **Fase 5: Integración**

1. Conexión con API backend (`lib/api`)
2. Gestión de estado global (`store/`)
3. Optimizaciones y refinamientos

## 📋 **Checklist de Implementación**

### ✅ **Completado**

- [x] Estructura de carpetas creada
- [x] Organización por funcionalidades
- [x] Separación clara de responsabilidades

### 📋 **Pendiente (Ready para desarrollo)**

- [ ] Configurar componentes UI base
- [ ] Implementar layout principal
- [ ] Crear tipos TypeScript
- [ ] Desarrollar páginas principales
- [ ] Integrar con backend API
- [ ] Implementar formularios complejos
- [ ] Añadir visualizaciones de datos
- [ ] Testing y optimizaciones

---

**Esta estructura está diseñada para ser escalable, mantenible y seguir las mejores prácticas de Next.js 13+ con App Router.**
