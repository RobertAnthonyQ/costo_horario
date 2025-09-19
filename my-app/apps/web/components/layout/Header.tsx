import { Search, Bell, ChevronDown, Menu } from "lucide-react";

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border glass shadow-custom-sm">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <button className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors duration-200 shadow-custom-sm">
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Search */}
        <div className="relative ml-1 flex-1 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar máquinas, cálculos..."
            className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary shadow-custom-sm"
          />
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3">
          <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200 shadow-custom-sm hover-lift">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground shadow-custom-sm animate-pulse">
              3
            </span>
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition-all duration-200 shadow-custom-sm hover-lift">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-white text-xs font-medium shadow-custom-sm">
              U
            </span>
            <span className="hidden sm:inline text-foreground font-medium">
              Usuario
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          </button>
        </div>
      </div>
    </header>
  );
}
