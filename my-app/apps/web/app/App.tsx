"use client";

import { Toaster } from "../components/ui/toaster";
import { Toaster as Sonner } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "../components/layout/app-layout";
import Dashboard from "../pages/Dashboard";
import Machines from "../pages/Machines";
import PossessionCalculation from "../pages/PossessionCalculation";
import NotFound from "../pages/NotFound";

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
            <Route
              path="/models"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Página de Modelos - Próximamente
                </div>
              }
            />
            <Route
              path="/brands"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Página de Marcas - Próximamente
                </div>
              }
            />
            <Route
              path="/components"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Página de Componentes - Próximamente
                </div>
              }
            />
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
            <Route
              path="/settings"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Configuración - Próximamente
                </div>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
