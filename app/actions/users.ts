"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, display_name, role, created_at")
      .order("created_at", { ascending: false })
    if (error) return { error: "Error al obtener usuarios" }
    return { data: data ?? [] }
  } catch {
    return { error: "Error inesperado" }
  }
}

export async function updateUserRole(userId: string, role: "admin" | "broker") {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from("user_profiles")
      .update({ role })
      .eq("id", userId)
    if (error) return { error: "Error al actualizar el rol" }
    revalidatePath("/admin/usuarios")
    return { data: { success: true } }
  } catch {
    return { error: "Error inesperado" }
  }
}

export async function inviteUser(email: string, displayName: string, role: "admin" | "broker") {
  try {
    const supabase = await createServerClient()
    // Use Supabase admin auth to invite
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { display_name: displayName },
    })
    if (authError) return { error: authError.message || "Error al invitar usuario" }

    // Create user profile with role
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: authData.user.id,
        display_name: displayName,
        role,
      })
    if (profileError) return { error: "Usuario invitado pero error al guardar perfil" }

    revalidatePath("/admin/usuarios")
    return { data: { success: true } }
  } catch {
    return { error: "Error inesperado al invitar usuario" }
  }
}
