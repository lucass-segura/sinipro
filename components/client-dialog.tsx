"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, FileText } from "lucide-react"
import { DateWheelPicker } from "@/components/ui/date-wheel-picker"
import { LocalityCombobox } from "@/components/locality-combobox"
import { createClient, updateClient } from "@/app/actions/clients"
import { POLICY_BRANCHES, VEHICLE_BRANCHES } from "@/types"

interface Policy {
  id?: string
  branch: string
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
  company_id: string
  companies?: { id: string; name: string }
}

interface Client {
  id: string
  full_name: string
  phone?: string
  email?: string
  locality?: string
  dni?: string
  address?: string
  birth_date?: string
  notes?: string
  created_at: string
  policies: Policy[]
}

interface Company {
  id: string
  name: string
}

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  companies: Company[]
  onSuccess: (client: Client) => void
}

const EMPTY_FORM = {
  full_name: "", phone: "", email: "", locality: "",
  dni: "", address: "", birth_date: "", notes: "",
}

export function ClientDialog({ open, onOpenChange, client, companies, onSuccess }: ClientDialogProps) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isMounted, setIsMounted] = useState(false)

  const isEditing = !!client

  useEffect(() => { if (open) setIsMounted(true) }, [open])

  useEffect(() => {
    if (!open) return
    if (client) {
      setFormData({
        full_name: client.full_name,
        phone: client.phone ?? "",
        email: client.email ?? "",
        locality: client.locality ?? "",
        dni: client.dni ?? "",
        address: client.address ?? "",
        birth_date: client.birth_date ?? "",
        notes: client.notes ?? "",
      })
      setPolicies(client.policies ?? [])
    } else {
      resetForm()
    }
    setErrors({})
  }, [client, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = "El nombre completo es requerido"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "El email no tiene un formato válido"
    policies.forEach((policy, i) => {
      if (!policy.branch) newErrors[`p${i}_branch`] = "La rama es requerida"
      if (!policy.company_id) newErrors[`p${i}_company`] = "La compañía es requerida"
      if (!policy.first_payment_date) newErrors[`p${i}_date`] = "La fecha es requerida"
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const result = isEditing
        ? await updateClient(client.id, formData, policies)
        : await createClient(formData, policies)
      if (result.error) setErrors({ general: result.error })
      else if (result.data) {
        onSuccess(result.data)
        handleOpenChange(false)
      }
    } catch {
      setErrors({ general: "Error inesperado. Intenta nuevamente." })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => { setFormData(EMPTY_FORM); setPolicies([]); setErrors({}) }

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return
    onOpenChange(newOpen)
    if (!newOpen) setTimeout(() => { setIsMounted(false); resetForm() }, 200)
  }

  const addPolicy = () =>
    setPolicies([...policies, { branch: "", vehicle_plate: "", policy_number: "", first_payment_date: "", company_id: "" }])

  const removePolicy = (index: number) => {
    if (window.confirm("¿Eliminar esta póliza?")) setPolicies(policies.filter((_, i) => i !== index))
  }

  const updatePolicy = (index: number, field: keyof Policy, value: string) => {
    const updated = [...policies]
    updated[index] = { ...updated[index], [field]: value }
    setPolicies(updated)
  }

  const field = (id: keyof typeof formData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={formData[id]}
        onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
        disabled={isLoading}
        className={errors[id] ? "border-destructive" : ""}
        {...props}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--sp-text)" }}>
            {isEditing ? "Editar Asegurado" : "Nuevo Asegurado"}
          </DialogTitle>
          <DialogDescription style={{ color: "var(--sp-text-muted)" }}>
            {isEditing ? "Modificá los datos del asegurado y sus pólizas." : "Ingresá los datos del nuevo asegurado."}
          </DialogDescription>
        </DialogHeader>

        {isMounted && (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Client data */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text-muted)" }}>
                Datos personales
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("full_name", "Nombre Completo *", { placeholder: "Juan Carlos Pérez" })}
                {field("dni", "DNI", { placeholder: "12345678" })}
                {field("phone", "Teléfono", { placeholder: "+54 299 123-4567" })}
                {field("email", "Email", { type: "email", placeholder: "juan@email.com" })}
                <div className="space-y-2">
                  <Label>Localidad</Label>
                  <LocalityCombobox
                    value={formData.locality}
                    onValueChange={(v) => setFormData({ ...formData, locality: v })}
                    disabled={isLoading}
                  />
                </div>
                {field("address", "Dirección", { placeholder: "Av. San Martín 123" })}
                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <DateWheelPicker
                    value={formData.birth_date}
                    onChange={(v) => setFormData({ ...formData, birth_date: v })}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Nota del asegurado</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas internas sobre el asegurado (visible en recordatorios)..."
                  rows={2}
                  disabled={isLoading}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* Policies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text-muted)" }}>
                  Pólizas
                </h3>
                <button
                  type="button"
                  onClick={addPolicy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: "var(--sp-accent-soft)",
                    border: "1px solid rgba(173,198,255,0.2)",
                    color: "var(--sp-accent-text)",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar Póliza
                </button>
              </div>

              {policies.length === 0 ? (
                <div
                  className="rounded-lg py-8 text-center"
                  style={{ border: "1px dashed var(--sp-border-strong)" }}
                >
                  <FileText className="h-7 w-7 mx-auto mb-2" style={{ color: "var(--sp-text-faint)" }} />
                  <p className="text-sm" style={{ color: "var(--sp-text-muted)" }}>Sin pólizas. Podés agregarlas ahora o después.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy, index) => (
                    <div
                      key={index}
                      className="rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--sp-surface-low)",
                        border: "1px solid var(--sp-border)",
                      }}
                    >
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: "1px solid var(--sp-border)" }}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
                          Póliza {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePolicy(index)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: "var(--sp-text-muted)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-red)"; e.currentTarget.style.backgroundColor = "var(--sp-red-soft)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-muted)"; e.currentTarget.style.backgroundColor = "transparent" }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-4 grid gap-3 sm:grid-cols-2">
                        {/* Branch */}
                        <div className="space-y-2">
                          <Label>Rama *</Label>
                          <Select
                            value={policy.branch}
                            onValueChange={(v) => updatePolicy(index, "branch", v)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className={errors[`p${index}_branch`] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Seleccionar rama" />
                            </SelectTrigger>
                            <SelectContent>
                              {POLICY_BRANCHES.map((b) => (
                                <SelectItem key={b} value={b}>{b}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`p${index}_branch`] && (
                            <p className="text-xs text-destructive">{errors[`p${index}_branch`]}</p>
                          )}
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                          <Label>Compañía *</Label>
                          <Select
                            value={policy.company_id}
                            onValueChange={(v) => updatePolicy(index, "company_id", v)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className={errors[`p${index}_company`] ? "border-destructive" : ""}>
                              <SelectValue placeholder="Seleccionar compañía" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`p${index}_company`] && (
                            <p className="text-xs text-destructive">{errors[`p${index}_company`]}</p>
                          )}
                        </div>

                        {/* Policy number */}
                        <div className="space-y-2">
                          <Label>N° de Póliza</Label>
                          <Input
                            value={policy.policy_number ?? ""}
                            onChange={(e) => updatePolicy(index, "policy_number", e.target.value)}
                            placeholder="Número de póliza"
                            disabled={isLoading}
                          />
                        </div>

                        {/* Vehicle plate — only for vehicle branches */}
                        {VEHICLE_BRANCHES.includes(policy.branch as any) && (
                          <div className="space-y-2">
                            <Label>Patente</Label>
                            <Input
                              value={policy.vehicle_plate ?? ""}
                              onChange={(e) => updatePolicy(index, "vehicle_plate", e.target.value.toUpperCase())}
                              placeholder="ABC123"
                              disabled={isLoading}
                              maxLength={10}
                            />
                          </div>
                        )}

                        {/* First payment date */}
                        <div className="space-y-2">
                          <Label>Fecha del Primer Cobro *</Label>
                          <DateWheelPicker
                            value={policy.first_payment_date}
                            onChange={(v) => updatePolicy(index, "first_payment_date", v)}
                            placeholder="Seleccionar fecha"
                          />
                          {errors[`p${index}_date`] && (
                            <p className="text-xs text-destructive">{errors[`p${index}_date`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errors.general && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--sp-red-soft)",
                  border: "1px solid var(--sp-red)",
                  color: "var(--sp-red)",
                }}
              >
                {errors.general}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                style={{ border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Actualizar" : "Crear"} asegurado
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
