import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import { Dashboard, Machines, PossessionCalculation, NotFound } from "./pages";
import { ConfigurationPage } from "./pages/configuration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/models" element={<ConfigurationPage />} />
            <Route path="/brands" element={<ConfigurationPage />} />
            <Route path="/components" element={<ConfigurationPage />} />
            <Route path="/settings" element={<ConfigurationPage />} />
            <Route path="/configuration" element={<ConfigurationPage />} />
            <Route path="/possession" element={<PossessionCalculation />} />
            <Route
              path="/hourly-cost"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Informe Costo Horario - Próximamente
                </div>
              }
            />
            <Route
              path="/calculation-history"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Historial de Cálculos - Próximamente
                </div>
              }
            />
            <Route
              path="/reports"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Reportes y Análisis - Próximamente
                </div>
              }
            />
            <Route path="/settings" element={<ConfigurationPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
