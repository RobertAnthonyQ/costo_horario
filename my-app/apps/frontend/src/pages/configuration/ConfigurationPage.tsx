import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Package,
  Truck,
  Factory,
  Wrench,
  BarChart3,
} from "lucide-react";
import {
  MarcasManagement,
  EquiposManagement,
  FlotasManagement,
  ComponentesManagement,
  TiposRatioManagement,
} from "./components";

export const ConfigurationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("marcas");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Datos Maestros</CardTitle>
          <CardDescription>
            Configure y administre las marcas, equipos, flotas, componentes y
            tipos de ratio de su sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger
                value="marcas"
                className="flex items-center space-x-2"
              >
                <Factory className="h-4 w-4" />
                <span>Marcas</span>
              </TabsTrigger>
              <TabsTrigger
                value="equipos"
                className="flex items-center space-x-2"
              >
                <Truck className="h-4 w-4" />
                <span>Equipos</span>
              </TabsTrigger>
              <TabsTrigger
                value="flotas"
                className="flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>Flotas</span>
              </TabsTrigger>
              <TabsTrigger
                value="componentes"
                className="flex items-center space-x-2"
              >
                <Wrench className="h-4 w-4" />
                <span>Componentes</span>
              </TabsTrigger>
              <TabsTrigger
                value="tipos-ratio"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Tipos Ratio</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marcas" className="space-y-4">
              <MarcasManagement />
            </TabsContent>

            <TabsContent value="equipos" className="space-y-4">
              <EquiposManagement />
            </TabsContent>

            <TabsContent value="flotas" className="space-y-4">
              <FlotasManagement />
            </TabsContent>

            <TabsContent value="componentes" className="space-y-4">
              <ComponentesManagement />
            </TabsContent>

            <TabsContent value="tipos-ratio" className="space-y-4">
              <TiposRatioManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
