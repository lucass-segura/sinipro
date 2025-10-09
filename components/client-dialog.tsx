"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, MapPin } from "lucide-react";
import { LocalityCombobox } from "@/components/locality-combobox";
import { createClient, updateClient } from "@/app/actions/clients";

interface Policy {
  id?: string;
  branch: string;
  vehicle_plate?: string;
  first_payment_date: string;
  company_id: string;
  companies?: {
    id: string;
    name: string;
  };
}

interface Client {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  locality?: string;
  created_at: string;
  policies: Policy[];
}

interface Company {
  id: string;
  name: string;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  companies: Company[];
  onSuccess: (client: Client) => void;
}

export function ClientDialog({
  open,
  onOpenChange,
  client,
  companies,
  onSuccess,
}: ClientDialogProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    locality: "",
  });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  const isEditing = !!client;

  useEffect(() => {
    if (open) {
      setIsMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          full_name: client.full_name,
          phone: client.phone || "",
          email: client.email || "",
          locality: client.locality || "",
        });
        setPolicies(client.policies || []);
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [client, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim())
      newErrors.full_name = "El nombre completo es requerido";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "El email no tiene un formato válido";
    policies.forEach((policy, index) => {
      if (!policy.branch)
        newErrors[`policy_${index}_branch`] = "La rama es requerida";
      if (!policy.company_id)
        newErrors[`policy_${index}_company`] = "La compañía es requerida";
      if (!policy.first_payment_date)
        newErrors[`policy_${index}_date`] =
          "La fecha del primer cobro es requerida";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = isEditing
        ? await updateClient(client.id, formData, policies)
        : await createClient(formData, policies);
      if (result.error) setErrors({ general: result.error });
      else if (result.data) {
        onSuccess(result.data);
        handleOpenChange(false);
      }
    } catch (err) {
      setErrors({ general: "Error inesperado. Intenta nuevamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: "", phone: "", email: "", locality: "" });
    setPolicies([]);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setTimeout(() => {
          setIsMounted(false);
          resetForm();
        }, 200);
      }
    }
  };

  const addPolicy = () =>
    setPolicies([
      ...policies,
      { branch: "", vehicle_plate: "", first_payment_date: "", company_id: "" },
    ]);
  const removePolicy = (index: number) => {
    if (window.confirm("¿Estás seguro de eliminar esta póliza?")) {
      setPolicies(policies.filter((_, i) => i !== index));
    }
  };
  const updatePolicy = (index: number, field: keyof Policy, value: string) => {
    const updatedPolicies = [...policies];
    updatedPolicies[index] = { ...updatedPolicies[index], [field]: value };
    setPolicies(updatedPolicies);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Agregar Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente y sus pólizas."
              : "Ingresa los datos del nuevo cliente y sus pólizas opcionales."}
          </DialogDescription>
        </DialogHeader>

        {isMounted && (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información del Cliente</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Juan Carlos Pérez"
                    disabled={isLoading}
                    className={errors.full_name ? "border-red-500" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600">{errors.full_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+54 299 123-4567"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="juan.perez@email.com"
                    disabled={isLoading}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality">Localidad</Label>
                  <LocalityCombobox
                    value={formData.locality}
                    onValueChange={(value) =>
                      setFormData({ ...formData, locality: value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Policies Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pólizas (Opcional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPolicy}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" /> Agregar Póliza
                </Button>
              </div>
              {policies.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      No hay pólizas agregadas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Póliza {index + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePolicy(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Rama *</Label>
                            <Select
                              value={policy.branch}
                              onValueChange={(value) =>
                                updatePolicy(index, "branch", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger
                                className={
                                  errors[`policy_${index}_branch`]
                                    ? "border-red-500"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="Seleccionar rama" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Automotores">
                                  Automotores
                                </SelectItem>
                                <SelectItem value="Motovehiculos">
                                  Motovehiculos
                                </SelectItem>
                                <SelectItem value="Responsabilidad civil">
                                  Responsabilidad civil
                                </SelectItem>
                                <SelectItem value="Accidente Personal">
                                  Accidente Personal
                                </SelectItem>
                                <SelectItem value="Bicicletas">
                                  Bicicletas
                                </SelectItem>
                                <SelectItem value="Integral de Comercio">
                                  Integral de Comercio
                                </SelectItem>
                                <SelectItem value="Combinado Familiar">
                                  Combinado Familiar
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {errors[`policy_${index}_branch`] && (
                              <p className="text-sm text-red-600">
                                {errors[`policy_${index}_branch`]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Compañía *</Label>
                            <Select
                              value={policy.company_id}
                              onValueChange={(value) =>
                                updatePolicy(index, "company_id", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger
                                className={
                                  errors[`policy_${index}_company`]
                                    ? "border-red-500"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="Seleccionar compañía" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company) => (
                                  <SelectItem
                                    key={company.id}
                                    value={company.id}
                                  >
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors[`policy_${index}_company`] && (
                              <p className="text-sm text-red-600">
                                {errors[`policy_${index}_company`]}
                              </p>
                            )}
                          </div>
                          {/* CAMBIO: Se muestra siempre si hay una rama seleccionada */}
                          {policy.branch && (
                            <div className="space-y-2">
                              <Label>Número de Póliza</Label>
                              <Input
                                value={policy.vehicle_plate || ""}
                                onChange={(e) =>
                                  updatePolicy(
                                    index,
                                    "vehicle_plate",
                                    e.target.value.toUpperCase()
                                  )
                                }
                                placeholder="N° de Póliza"
                                disabled={isLoading}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Fecha del Primer Cobro *</Label>
                            <Input
                              type="date"
                              value={policy.first_payment_date}
                              onChange={(e) =>
                                updatePolicy(
                                  index,
                                  "first_payment_date",
                                  e.target.value
                                )
                              }
                              disabled={isLoading}
                              className={
                                errors[`policy_${index}_date`]
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {errors[`policy_${index}_date`] && (
                              <p className="text-sm text-red-600">
                                {errors[`policy_${index}_date`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Crear"} Cliente
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}