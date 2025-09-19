import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-muted lg:pl-64">
      {/* Fixed Sidebar on desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 border-r bg-white">
        <Sidebar />
      </aside>

      {/* Main area */}
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
