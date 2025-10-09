import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building,
  Calculator,
  FileText,
  Home,
  Settings,
  Truck,
  Tags,
  Building2,
  Wrench,
  TrendingUp,
  History,
  ChevronDown,
  DollarSign,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const assetItems = [
  { title: "Máquinas", url: "/machines", icon: Truck },
  { title: "Data Maestra", url: "/components", icon: Wrench },
  { title: "Ratios de Mantenimiento", url: "/ratios", icon: BarChart3 },
  { title: "PICs", url: "/pics", icon: FileText },
  { title: "Cálculo de Posesión", url: "/possession", icon: Calculator },
  { title: "Informe Costo Horario", url: "/hourly-cost", icon: TrendingUp },
];

const financialItems = [
  { title: "Flujo de Caja", url: "/cash-flow", icon: DollarSign },
  { title: "Conclusiones", url: "/conclusions", icon: BarChart3 },
];

const reportItems = [
  { title: "Reportes y Análisis", url: "/reports", icon: BarChart3 },
];

const configItems = [
  { title: "Configuración", url: "/settings", icon: Settings },
];

interface MenuGroupProps {
  title: string;
  items: typeof assetItems;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

function MenuGroup({
  title,
  items,
  isCollapsible = false,
  defaultOpen = true,
}: MenuGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;
  const hasActiveItem = items.some((item) => isActive(item.url));

  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-muted/50 text-foreground hover:text-foreground";

  const content = (
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild className={getNavClass(item.url)}>
              <NavLink to={item.url} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );

  if (isCollapsible && !isCollapsed) {
    return (
      <Collapsible open={isOpen || hasActiveItem} onOpenChange={setIsOpen}>
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="group/label w-full flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1">
              {title}
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/label:rotate-180 h-4 w-4" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>{content}</CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  }

  return (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      {content}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Building className="h-8 w-8 text-primary" />
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">CostTracker</h2>
              <p className="text-xs text-muted-foreground">Gestión de Costos</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <MenuGroup
          title="Gestión de Activos"
          items={assetItems}
          isCollapsible
          defaultOpen
        />
        <MenuGroup
          title="Evaluación Financiera"
          items={financialItems}
          isCollapsible
          defaultOpen
        />
        <MenuGroup title="Reportes" items={reportItems} />
        <MenuGroup title="Sistema" items={configItems} />
      </SidebarContent>
    </Sidebar>
  );
}
