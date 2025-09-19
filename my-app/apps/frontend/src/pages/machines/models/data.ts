// Mock machines data - Updated to match new structure

import { Machine } from "./types";

export const machines: Machine[] = [
  {
    id: 1,
    modelo_id: 1,
    estado: "activo",
    horometro_inicial: 2840,
    link_imagen: "/src/assets/hero-machinery.jpg",
    politica_depreciacion: 15,
    tiempo_entrega: 30,
    valor_similar_nuevo: 150000,
    valor_venta: 135000,
    vida_util: 10,
    otros_json: { ubicacion: "Obra Norte", codigo: "EQ-001" },
    created_at: "2024-01-15T10:30:00Z",
    modelo: {
      id: 1,
      nombre: "320D",
      marca_id: 1,
      equipo_id: 1,
      flota_id: 1,
      porcentaje_utilidad: 0.12,
      vida_util_fabricante: 12,
      created_at: "2024-01-01T00:00:00Z",
      marca: {
        id: 1,
        nombre: "Caterpillar",
        created_at: "2024-01-01T00:00:00Z",
      },
      equipo: {
        id: 1,
        nombre: "Excavadora",
        created_at: "2024-01-01T00:00:00Z",
      },
      flota: {
        id: 1,
        nombre: "Flota Principal",
        created_at: "2024-01-01T00:00:00Z",
      },
    },
  },
  {
    id: 2,
    modelo_id: 2,
    estado: "mantenimiento",
    horometro_inicial: 5420,
    link_imagen: "/src/assets/hero-machinery.jpg",
    politica_depreciacion: 18,
    tiempo_entrega: 45,
    valor_similar_nuevo: 80000,
    valor_venta: 65000,
    vida_util: 8,
    otros_json: { ubicacion: "Taller Central", codigo: "EQ-002" },
    created_at: "2024-02-10T14:20:00Z",
    modelo: {
      id: 2,
      nombre: "F-150",
      marca_id: 2,
      equipo_id: 2,
      flota_id: 1,
      porcentaje_utilidad: 0.1,
      vida_util_fabricante: 8,
      created_at: "2024-01-01T00:00:00Z",
      marca: {
        id: 2,
        nombre: "Ford",
        created_at: "2024-01-01T00:00:00Z",
      },
      equipo: {
        id: 2,
        nombre: "Camión",
        created_at: "2024-01-01T00:00:00Z",
      },
      flota: {
        id: 1,
        nombre: "Flota Principal",
        created_at: "2024-01-01T00:00:00Z",
      },
    },
  },
  {
    id: 3,
    modelo_id: 3,
    estado: "activo",
    horometro_inicial: 1650,
    link_imagen: "/src/assets/hero-machinery.jpg",
    politica_depreciacion: 14,
    tiempo_entrega: 35,
    valor_similar_nuevo: 135000,
    valor_venta: 118000,
    vida_util: 11,
    otros_json: { ubicacion: "Obra Sur", codigo: "EQ-003" },
    created_at: "2024-03-05T09:15:00Z",
    modelo: {
      id: 3,
      nombre: "EC140D",
      marca_id: 3,
      equipo_id: 1,
      flota_id: 2,
      porcentaje_utilidad: 0.13,
      vida_util_fabricante: 11,
      created_at: "2024-01-01T00:00:00Z",
      marca: {
        id: 3,
        nombre: "Volvo",
        created_at: "2024-01-01T00:00:00Z",
      },
      equipo: {
        id: 1,
        nombre: "Excavadora",
        created_at: "2024-01-01T00:00:00Z",
      },
      flota: {
        id: 2,
        nombre: "Flota Secundaria",
        created_at: "2024-01-01T00:00:00Z",
      },
    },
  },
  {
    id: 4,
    modelo_id: 4,
    estado: "activo",
    horometro_inicial: 3200,
    link_imagen: "/src/assets/hero-machinery.jpg",
    politica_depreciacion: 16,
    tiempo_entrega: 25,
    valor_similar_nuevo: 95000,
    valor_venta: 82000,
    vida_util: 9,
    otros_json: { ubicacion: "Obra Este", codigo: "EQ-004" },
    created_at: "2024-03-20T16:45:00Z",
    modelo: {
      id: 4,
      nombre: "3CX",
      marca_id: 4,
      equipo_id: 3,
      flota_id: 1,
      porcentaje_utilidad: 0.11,
      vida_util_fabricante: 9,
      created_at: "2024-01-01T00:00:00Z",
      marca: {
        id: 4,
        nombre: "JCB",
        created_at: "2024-01-01T00:00:00Z",
      },
      equipo: {
        id: 3,
        nombre: "Retroexcavadora",
        created_at: "2024-01-01T00:00:00Z",
      },
      flota: {
        id: 1,
        nombre: "Flota Principal",
        created_at: "2024-01-01T00:00:00Z",
      },
    },
  },
  {
    id: 5,
    modelo_id: 5,
    estado: "inactivo",
    horometro_inicial: 4100,
    link_imagen: "/src/assets/hero-machinery.jpg",
    politica_depreciacion: 17,
    tiempo_entrega: 40,
    valor_similar_nuevo: 125000,
    valor_venta: 95000,
    vida_util: 10,
    otros_json: { ubicacion: "Depósito", codigo: "EQ-005" },
    created_at: "2024-04-02T11:30:00Z",
    modelo: {
      id: 5,
      nombre: "PC200-8",
      marca_id: 5,
      equipo_id: 1,
      flota_id: 2,
      porcentaje_utilidad: 0.12,
      vida_util_fabricante: 12,
      created_at: "2024-01-01T00:00:00Z",
      marca: {
        id: 5,
        nombre: "Komatsu",
        created_at: "2024-01-01T00:00:00Z",
      },
      equipo: {
        id: 1,
        nombre: "Excavadora",
        created_at: "2024-01-01T00:00:00Z",
      },
      flota: {
        id: 2,
        nombre: "Flota Secundaria",
        created_at: "2024-01-01T00:00:00Z",
      },
    },
  },
];

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "activo":
      return "bg-success text-success-foreground";
    case "mantenimiento":
    case "en_reparacion":
      return "bg-warning text-warning-foreground";
    case "inactivo":
    case "fuera_servicio":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatHours = (hours: number | undefined): string => {
  if (hours === undefined || hours === null) return "N/A";
  return `${hours.toLocaleString()} hrs`;
};

export const getMachineCode = (machine: Machine): string => {
  if (
    machine.otros_json &&
    typeof machine.otros_json === "object" &&
    "codigo" in machine.otros_json
  ) {
    return machine.otros_json.codigo as string;
  }
  return `MAQ-${machine.id.toString().padStart(3, "0")}`;
};

export const getMachineLocation = (machine: Machine): string => {
  if (
    machine.otros_json &&
    typeof machine.otros_json === "object" &&
    "ubicacion" in machine.otros_json
  ) {
    return machine.otros_json.ubicacion as string;
  }
  return "No especificado";
};
