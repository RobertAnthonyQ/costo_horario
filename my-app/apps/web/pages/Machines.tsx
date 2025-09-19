"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  MoreVertical,
  Truck,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

// Mock data
const machines = [
  {
    id: 1,
    codigo: "EQ-001",
    equipo: "Excavadora",
    marca: "Caterpillar",
    modelo: "320D",
    estado: "Activo",
    horometro: 2840,
    valor: 150000,
    ubicacion: "Obra Norte",
  },
  {
    id: 2,
    codigo: "EQ-002",
    equipo: "Camión",
    marca: "Ford",
    modelo: "F-150",
    estado: "Mantenimiento",
    horometro: 5420,
    valor: 80000,
    ubicacion: "Taller Central",
  },
  {
    id: 3,
    codigo: "EQ-003",
    equipo: "Excavadora",
    marca: "Volvo",
    modelo: "EC140D",
    estado: "Activo",
    horometro: 1650,
    valor: 135000,
    ubicacion: "Obra Sur",
  },
  {
    id: 4,
    codigo: "EQ-004",
    equipo: "Retroexcavadora",
    marca: "JCB",
    modelo: "3CX",
    estado: "Activo",
    horometro: 3200,
    valor: 95000,
    ubicacion: "Obra Este",
  },
  {
    id: 5,
    codigo: "EQ-005",
    equipo: "Excavadora",
    marca: "Komatsu",
    modelo: "PC200-8",
    estado: "Inactivo",
    horometro: 4100,
    valor: 125000,
    ubicacion: "Depósito",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Activo":
      return "bg-success text-success-foreground";
    case "Mantenimiento":
      return "bg-warning text-warning-foreground";
    case "Inactivo":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export default function Machines() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMachines = machines.filter(
    (machine) =>
      machine.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Máquinas
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra tu flota de maquinaria pesada
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Máquina
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Máquinas</p>
                <p className="text-2xl font-bold text-foreground">47</p>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold text-success">32</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-success"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  En Mantenimiento
                </p>
                <p className="text-2xl font-bold text-warning">8</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">$2.4M</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por código, equipo, marca..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
              <Button variant="outline" size="default">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
            <Button variant="outline" size="default">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Machines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Máquinas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Horómetro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMachines.map((machine) => (
                <TableRow key={machine.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {machine.codigo}
                  </TableCell>
                  <TableCell>{machine.equipo}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{machine.marca}</p>
                      <p className="text-sm text-muted-foreground">
                        {machine.modelo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(machine.estado)}>
                      {machine.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {machine.horometro.toLocaleString()} hrs
                  </TableCell>
                  <TableCell>${machine.valor.toLocaleString()}</TableCell>
                  <TableCell>{machine.ubicacion}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="mr-2 h-4 w-4" />
                          Calcular costos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
