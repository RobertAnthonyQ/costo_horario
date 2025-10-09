import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import {
  Machines,
  PossessionCalculation,
  RatiosCalculation,
  HourlyCostReport,
  CashFlowAnalysis,
  PICsCalculation,
  Reports,
  ConclusionsPage,
  NotFound,
} from "./pages";
import { ConfigurationPage } from "./pages/configuration";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/machines" replace />}
                      />
                      <Route path="/machines" element={<Machines />} />
                      <Route path="/models" element={<ConfigurationPage />} />
                      <Route path="/brands" element={<ConfigurationPage />} />
                      <Route
                        path="/components"
                        element={<ConfigurationPage />}
                      />
                      <Route
                        path="/configuration"
                        element={<ConfigurationPage />}
                      />
                      <Route
                        path="/possession"
                        element={<PossessionCalculation />}
                      />
                      <Route path="/ratios" element={<RatiosCalculation />} />
                      <Route
                        path="/ratios/compare"
                        element={<RatiosCalculation />}
                      />
                      <Route
                        path="/hourly-cost"
                        element={<HourlyCostReport />}
                      />
                      <Route path="/cash-flow" element={<CashFlowAnalysis />} />
                      <Route path="/pics" element={<PICsCalculation />} />
                      <Route
                        path="/conclusions"
                        element={<ConclusionsPage />}
                      />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<ConfigurationPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
