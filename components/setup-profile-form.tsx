"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface SetupProfileFormProps {
  userEmail: string
}

export function SetupProfileForm({ userEmail }: SetupProfileFormProps) {
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) {
      setError("El nombre es requerido")
      return
    }

    if (displayName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres")
      return
    }

    if (displayName.trim().length > 50) {
      setError("El nombre no puede tener más de 50 caracteres")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Error de autenticación")
        return
      }

      const { error: insertError } = await supabase.from("user_profiles").insert({
        id: user.id,
        display_name: displayName.trim(),
      })

      if (insertError) {
        console.error("Error creating profile:", insertError)
        setError("Error al crear el perfil. Inténtalo de nuevo.")
        return
      }

      router.push("/avisos")
      router.refresh()
    } catch (err) {
      console.error("Error:", err)
      setError("Error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
          Correo electrónico
        </Label>
        <Input id="email" type="email" value={userEmail} disabled className="bg-slate-50 text-slate-600" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-medium text-slate-700">
          Nombre de usuario *
        </Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ingresa tu nombre"
          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
          maxLength={50}
        />
        <p className="text-xs text-slate-500">Este nombre se usará para identificarte en el sistema</p>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Configurando...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  )
}
