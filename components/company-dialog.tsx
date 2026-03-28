"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, Building2 } from "lucide-react"
import { createCompany, updateCompany } from "@/app/actions/companies"

interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface CompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: Company | null
  onSuccess: (company: Company) => void
}

export function CompanyDialog({ open, onOpenChange, company, onSuccess }: CompanyDialogProps) {
  const [name, setName] = useState(company?.name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const isEditing = !!company

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError("El nombre de la compañía es requerido"); return }
    setIsLoading(true)
    setError("")
    try {
      const result = isEditing
        ? await updateCompany(company.id, name.trim())
        : await createCompany(name.trim())
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onSuccess(result.data)
        setName("")
      }
    } catch {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) { setName(company?.name || ""); setError("") }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[440px]"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)" }}
            >
              <Building2 className="h-5 w-5" style={{ color: "#001a42" }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--sp-text)" }}>
                {isEditing ? "Editar Compañía" : "Nueva Compañía"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                {isEditing ? "Modificá los datos de la aseguradora." : "Ingresá el nombre de la nueva aseguradora."}
              </p>
            </div>
          </div>

          {/* Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
              Nombre de la compañía *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError("") }}
              placeholder="Ej: Sancor Seguros"
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--sp-surface-low)",
                border: `1px solid ${error ? "var(--sp-red)" : "var(--sp-border-strong)"}`,
                color: "var(--sp-text)",
              }}
              onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)" }}
              onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--sp-border-strong)" }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(e as any)}
            />
            {error && <p className="text-xs" style={{ color: "var(--sp-red)" }}>{error}</p>}
          </div>

          {/* Actions */}
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
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar" : "Crear"} Compañía
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
