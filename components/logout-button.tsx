"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LogOut, User } from "lucide-react"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("user_profiles").select("display_name").eq("id", user.id).single()

        if (profile?.display_name) {
          setUserName(profile.display_name)
        } else if (user.email) {
          // Fallback al email si no hay perfil (no debería pasar con el middleware)
          const name = user.email.split("@")[0]
          setUserName(name)
        }
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    const confirmed = window.confirm("¿Está seguro que desea cerrar sesión?")
    if (!confirmed) return

    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {userName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Hola {userName}!</span>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
        className="font-medium bg-transparent p-2"
        title="Cerrar Sesión"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
