import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CrudTableItem {
  id: number;
  nombre: string;
  created_at?: string;
  [key: string]: any;
}

interface CrudTableColumn {
  key: string;
  label: string;
  render?: (value: any, item: CrudTableItem) => React.ReactNode;
}

interface CrudTableProps<T extends CrudTableItem> {
  title: string;
  description: string;
  items: T[];
  columns: CrudTableColumn[];
  loading: boolean;
  error?: string;
  onAdd: (item: any) => Promise<void>;
  onEdit: (id: number, item: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
  formFields: {
    key: keyof T;
    label: string;
    type: "text" | "number" | "select";
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
}

export function CrudTable<T extends CrudTableItem>({
  title,
  description,
  items,
  columns,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  formFields,
}: CrudTableProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredItems = items.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
    setFormError("");
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: T) => {
    setFormData(item);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (editingItem) {
        await onEdit(editingItem.id, formData);
      } else {
        await onAdd(formData);
      }
      setIsDialogOpen(false);
      resetForm();
      await onRefresh();
    } catch (error: any) {
      setFormError(error.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: T) => {
    if (window.confirm(`¿Está seguro de eliminar "${item.nombre}"?`)) {
      try {
        await onDelete(item.id);
        await onRefresh();
      } catch (error: any) {
        alert("Error al eliminar: " + (error.message || "Error desconocido"));
      }
    }
  };

  const handleInputChange = (key: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar {title.slice(0, -1)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar" : "Agregar"} {title.slice(0, -1)}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                {formFields.map((field) => (
                  <div key={field.key as string} className="space-y-2">
                    <Label htmlFor={field.key as string}>
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {field.type === "select" ? (
                      <Select
                        value={(formData[field.key] as string) || "EMPTY_VALUE"}
                        onValueChange={(value) => {
                          // Si el valor es "EMPTY_VALUE", enviamos string vacío
                          const finalValue =
                            value === "EMPTY_VALUE" ? "" : value;
                          handleInputChange(field.key, finalValue);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem
                              key={option.value || "EMPTY_VALUE"}
                              value={option.value || "EMPTY_VALUE"}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.key as string}
                        type={field.type}
                        value={formData[field.key] || ""}
                        onChange={(e) =>
                          handleInputChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingItem ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={onRefresh} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Actualizar"
            )}
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center py-4"
                  >
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Cargando...
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center py-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? "No se encontraron resultados"
                        : `No hay ${title.toLowerCase()} registradas`}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredItems.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredItems.length} de {items.length}{" "}
            {title.toLowerCase()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
