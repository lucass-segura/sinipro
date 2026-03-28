"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateDisplayName(displayName: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: "Usuario no autenticado" }

    const trimmed = displayName.trim()
    if (!trimmed || trimmed.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" }
    if (trimmed.length > 60) return { error: "El nombre no puede superar los 60 caracteres" }

    const { error } = await supabase
      .from("user_profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id)

    if (error) return { error: "Error al actualizar el nombre" }

    revalidatePath("/perfil")
    revalidatePath("/dashboard")
    return { data: { display_name: trimmed } }
  } catch {
    return { error: "Error inesperado" }
  }
}

export async function getProfile() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: "Usuario no autenticado" }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()

    return {
      data: {
        email: user.email ?? "",
        display_name: profile?.display_name ?? "",
        created_at: user.created_at,
      }
    }
  } catch {
    return { error: "Error inesperado" }
  }
}
