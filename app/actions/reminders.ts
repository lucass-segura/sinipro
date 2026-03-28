"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function logReminder(
  noticeId: string,
  channel: "whatsapp" | "email" | "manual",
  recipientPhone?: string,
  recipientEmail?: string,
  messagePreview?: string
) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return { error: "Usuario no autenticado" }

    const { data, error } = await supabase
      .from("reminder_logs")
      .insert({
        notice_id: noticeId,
        sent_by: user.id,
        channel,
        recipient_phone: recipientPhone || null,
        recipient_email: recipientEmail || null,
        message_preview: messagePreview || null,
      })
      .select(`*, user_profiles(display_name)`)
      .single()

    if (error) {
      console.error("Error logging reminder:", error)
      return { error: "Error al registrar el recordatorio" }
    }

    revalidatePath("/avisos")
    return { data }
  } catch {
    return { error: "Error inesperado al registrar recordatorio" }
  }
}

export async function getReminderLogs(noticeId: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("reminder_logs")
      .select(`*, user_profiles(display_name)`)
      .eq("notice_id", noticeId)
      .order("sent_at", { ascending: false })

    if (error) return { data: [] }
    return { data: data ?? [] }
  } catch {
    return { data: [] }
  }
}
