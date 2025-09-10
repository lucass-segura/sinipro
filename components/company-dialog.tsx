"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
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

    if (!name.trim()) {
      setError("El nombre de la compañía es requerido")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      let result
      if (isEditing) {
        result = await updateCompany(company.id, name.trim())
      } else {
        result = await createCompany(name.trim())
      }

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onSuccess(result.data)
        setName("")
      }
    } catch (err) {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setName(company?.name || "")
        setError("")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Compañía" : "Añadir Nueva Compañía"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos de la compañía seleccionada."
                : "Ingresa los datos de la nueva compañía de seguros."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Compañía *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Sancor Seguros"
                disabled={isLoading}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Actualizar" : "Crear"} Compañía
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
