"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Truck,
  Tags,
  Building2,
  Cog,
  ClipboardList,
  Calculator,
  LineChart,
  FileBarChart2,
} from "lucide-react";

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="h-full w-64 bg-sidebar-background border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold shadow-custom-sm">
          CT
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-semibold text-sidebar-foreground">
            CostTracker
          </h1>
          <p className="text-xs text-sidebar-foreground/70">
            Gestión de Costos
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {/* Principal */}
        <div>
          <SectionLabel>Principal</SectionLabel>
          <SidebarItem
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            href="/"
            active={pathname === "/"}
          />
        </div>

        {/* Gestión de Activos */}
        <div>
          <SectionLabel>Gestión de Activos</SectionLabel>
          <div className="space-y-1">
            <SidebarItem
              icon={<Truck className="h-4 w-4" />}
              label="Máquinas"
              href="/gestion-activos/maquinas"
              active={pathname === "/gestion-activos/maquinas"}
            />
            <SidebarItem
              icon={<Tags className="h-4 w-4" />}
              label="Modelos"
              href="/gestion-activos/modelos"
              active={pathname === "/gestion-activos/modelos"}
            />
            <SidebarItem
              icon={<Building2 className="h-4 w-4" />}
              label="Marcas"
              href="/gestion-activos/marcas"
              active={pathname === "/gestion-activos/marcas"}
            />
            <SidebarItem
              icon={<Cog className="h-4 w-4" />}
              label="Componentes"
              href="/gestion-activos/componentes"
              active={pathname === "/gestion-activos/componentes"}
            />
          </div>
        </div>

        {/* Cálculos Financieros */}
        <div>
          <SectionLabel>Cálculos Financieros</SectionLabel>
          <div className="space-y-1">
            <SidebarItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Cálculo de Posesión"
              href="/calculos/posesion"
              active={pathname === "/calculos/posesion"}
            />
            <SidebarItem
              icon={<Calculator className="h-4 w-4" />}
              label="Informe Costo Horario"
              href="/calculos/costo-horario"
              active={pathname === "/calculos/costo-horario"}
            />
            <SidebarItem
              icon={<LineChart className="h-4 w-4" />}
              label="Historial de Cálculos"
              href="/calculos/historial"
              active={pathname === "/calculos/historial"}
            />
          </div>
        </div>

        {/* Reportes */}
        <div>
          <SectionLabel>Reportes</SectionLabel>
          <SidebarItem
            icon={<FileBarChart2 className="h-4 w-4" />}
            label="Reportes y Análisis"
            href="/reportes"
            active={pathname === "/reportes"}
          />
        </div>

        {/* Sistema */}
        <div>
          <SectionLabel>Sistema</SectionLabel>
          <SidebarItem
            icon={<Settings className="h-4 w-4" />}
            label="Configuración"
            href="/configuracion"
            active={pathname === "/configuracion"}
          />
        </div>
      </nav>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="px-2 mb-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
      {children}
    </h3>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active = false }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ` +
        (active
          ? "bg-sidebar-accent text-sidebar-primary shadow-custom-sm border-l-2 border-sidebar-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")
      }
    >
      <span
        className={
          active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
        }
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
