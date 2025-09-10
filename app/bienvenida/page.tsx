import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function BienvenidaPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Verificar si el usuario tiene perfil configurado
  const { data: profile } = await supabase.from("user_profiles").select("display_name").eq("id", user.id).single()

  if (!profile) {
    redirect("/setup-profile")
  }

  // Redirigir a avisos como página principal
  redirect("/avisos")
}
