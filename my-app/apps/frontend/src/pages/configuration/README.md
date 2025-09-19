# Página de Configuración - Sistema de Gestión de Activos

## Descripción

La página de configuración permite administrar todos los datos maestros del sistema de gestión de activos, incluyendo:

- **Marcas**: Fabricantes de equipos (Caterpillar, Komatsu, Volvo, etc.)
- **Equipos**: Tipos de maquinaria (Excavadora, Bulldozer, Cargador, etc.)
- **Flotas**: Grupos de equipos (Minería, Construcción, Forestal, etc.)
- **Componentes**: Partes de equipos (Motor, Transmisión, Hidráulico, etc.)

## Estructura de Archivos

```
src/pages/configuration/
├── ConfigurationPage.tsx          # Página principal con tabs
├── index.ts                       # Archivo de exportación
└── components/
    ├── CrudTable.tsx              # Componente reutilizable para tablas CRUD
    ├── MarcasManagement.tsx       # Gestión de marcas
    ├── EquiposManagement.tsx      # Gestión de equipos
    ├── FlotasManagement.tsx       # Gestión de flotas
    └── ComponentesManagement.tsx  # Gestión de componentes

src/services/
├── marcasService.ts               # Servicio para marcas
├── equiposService.ts              # Servicio para equipos
├── flotasService.ts               # Servicio para flotas
└── componentesService.ts          # Servicio para componentes

src/hooks/
└── useEntityManager.ts            # Hook para gestión de entidades

src/components/ui/
└── stats.tsx                      # Componentes para estadísticas
```

## Características

### ✅ Funcionalidades Implementadas

- **Interfaz con Tabs**: Navegación fácil entre diferentes tipos de datos
- **Operaciones CRUD Completas**: Crear, Leer, Actualizar y Eliminar
- **Búsqueda en Tiempo Real**: Filtrado de resultados
- **Validaciones**: Campos requeridos y tipos de datos
- **Manejo de Errores**: Mensajes informativos para el usuario
- **Loading States**: Indicadores de carga para mejor UX
- **Confirmaciones**: Diálogos de confirmación para eliminación
- **Responsive Design**: Adaptable a diferentes tamaños de pantalla

### 🎨 Componentes UI

- **CrudTable**: Tabla reutilizable con acciones CRUD
- **Dialog Modal**: Formularios modales para crear/editar
- **Search Bar**: Búsqueda con icono
- **Badges**: Indicadores de cantidad de relaciones
- **Alert Messages**: Notificaciones de éxito/error
- **Loading Spinners**: Indicadores de carga

## Uso

### Acceso a la Página

La página de configuración está disponible en múltiples rutas:

- `/configuration` - Ruta principal
- `/settings` - Configuración del sistema
- `/models` - Redirige a configuración (tab de marcas/equipos)
- `/brands` - Redirige a configuración (tab de marcas)
- `/components` - Redirige a configuración (tab de componentes)

### Operaciones

#### Agregar Nueva Entidad

1. Hacer clic en el botón "Agregar [Entidad]"
2. Completar el formulario en el modal
3. Hacer clic en "Crear"

#### Editar Entidad

1. Hacer clic en el icono de edición (lápiz)
2. Modificar los campos necesarios
3. Hacer clic en "Actualizar"

#### Eliminar Entidad

1. Hacer clic en el icono de eliminación (papelera)
2. Confirmar en el diálogo de confirmación

#### Buscar

- Escribir en la barra de búsqueda para filtrar por nombre

## Servicios Backend

### Endpoints Utilizados

- **Marcas**: `/marcas`
- **Equipos**: `/equipos`
- **Flotas**: `/flotas`
- **Componentes**: `/componentes`

### Métodos HTTP

- `GET /` - Obtener todas las entidades
- `GET /:id` - Obtener una entidad específica
- `POST /` - Crear nueva entidad
- `PATCH /:id` - Actualizar entidad existente
- `DELETE /:id` - Eliminar entidad

## Validaciones

### Frontend

- Campos requeridos marcados con asterisco (\*)
- Validación de tipos de datos
- Mensajes de error específicos

### Backend

- Validación de duplicados (nombres únicos)
- Verificación de relaciones antes de eliminar
- Manejo de errores de base de datos

## Personalización

### Agregar Nueva Entidad

1. **Crear Servicio**:

```typescript
// src/services/nuevaEntidadService.ts
export interface NuevaEntidad {
  id: number;
  nombre: string;
  // otros campos...
}

export const nuevaEntidadService = new NuevaEntidadService();
```

2. **Crear Componente de Gestión**:

```typescript
// src/pages/configuration/components/NuevaEntidadManagement.tsx
export const NuevaEntidadManagement: React.FC = () => {
  // Implementación usando CrudTable
};
```

3. **Agregar Tab**:

```typescript
// ConfigurationPage.tsx
<TabsTrigger value="nueva-entidad">Nueva Entidad</TabsTrigger>
<TabsContent value="nueva-entidad">
  <NuevaEntidadManagement />
</TabsContent>
```

### Personalizar Columnas

```typescript
const columns = [
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'custom',
    label: 'Campo Personalizado',
    render: (value, item) => <Badge>{value}</Badge>
  },
];
```

## Mejoras Futuras

- [ ] Importación/Exportación de datos (CSV, Excel)
- [ ] Filtros avanzados
- [ ] Ordenamiento por columnas
- [ ] Paginación para grandes volúmenes de datos
- [ ] Historial de cambios
- [ ] Bulk operations (operaciones en lote)
- [ ] Dashboard de estadísticas
- [ ] Configuración de permisos por rol

## Dependencias

```json
{
  "@radix-ui/react-dialog": "^1.0.0",
  "@radix-ui/react-tabs": "^1.0.0",
  "lucide-react": "^0.263.0",
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0"
}
```
