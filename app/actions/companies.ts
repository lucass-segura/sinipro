"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCompany(name: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("companies").insert([{ name }]).select().single()

    if (error) {
      if (error.code === "23505") {
        return { error: "Ya existe una compañía con ese nombre" }
      }
      return { error: "Error al crear la compañía" }
    }

    revalidatePath("/companias")
    return { data }
  } catch (error) {
    return { error: "Error inesperado al crear la compañía" }
  }
}

export async function updateCompany(id: string, name: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("companies").update({ name }).eq("id", id).select().single()

    if (error) {
      if (error.code === "23505") {
        return { error: "Ya existe una compañía con ese nombre" }
      }
      return { error: "Error al actualizar la compañía" }
    }

    revalidatePath("/companias")
    return { data }
  } catch (error) {
    return { error: "Error inesperado al actualizar la compañía" }
  }
}
