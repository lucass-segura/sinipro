"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { NoticeFilters } from "@/types"

export async function updateNoticeStatus(noticeId: string, status: "avisar" | "avisado" | "pagado") {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return { error: "Usuario no autenticado" }

    const updateData: Record<string, unknown> = { status }

    if (status === "avisado") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()

      updateData.notified_by = profile?.display_name || user.email?.split("@")[0] || "Usuario"
    } else if (status === "avisar") {
      updateData.notified_by = null
    }

    if (status === "avisado") {
      const { data: currentNotice, error: currentError } = await supabase
        .from("policy_notices")
        .select("*, policies(id)")
        .eq("id", noticeId)
        .single()

      if (currentError || !currentNotice) return { error: "Error al obtener el aviso actual" }

      // Soft delete future pending notice if reverting from "pagado"
      if (currentNotice.status === "pagado") {
        const { data: futureNotices } = await supabase
          .from("policy_notices")
          .select("*")
          .eq("policy_id", currentNotice.policies.id)
          .gt("due_date", currentNotice.due_date)
          .eq("status", "avisar")
          .is("deleted_at", null)

        if (futureNotices && futureNotices.length > 0) {
          const nextNotice = futureNotices.sort(
            (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          )[0]
          // Soft delete instead of hard delete
          await supabase
            .from("policy_notices")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", nextNotice.id)
        }
      }
    }

    const { data, error } = await supabase
      .from("policy_notices")
      .update(updateData)
      .eq("id", noticeId)
      .select()
      .single()

    if (error) return { error: "Error al actualizar el estado del aviso" }

    revalidatePath("/avisos")
    revalidatePath("/dashboard")
    return { data }
  } catch {
    return { error: "Error inesperado al actualizar el estado" }
  }
}

export async function processPayment(noticeId: string, installments: number) {
  try {
    const supabase = await createServerClient()

    const { data: notice, error: noticeError } = await supabase
      .from("policy_notices")
      .select(`*, policies(*, clients(id, full_name, phone, email), companies(id, name))`)
      .eq("id", noticeId)
      .single()

    if (noticeError || !notice) return { error: "Error al obtener el aviso" }

    const currentDueDate = new Date(notice.due_date)
    const nextDueDate = new Date(currentDueDate)
    nextDueDate.setMonth(nextDueDate.getMonth() + installments)

    const { error: updateError } = await supabase
      .from("policy_notices")
      .update({ status: "pagado", paid_installments: installments })
      .eq("id", noticeId)

    if (updateError) return { error: "Error al actualizar el estado del pago" }

    // Create next notice
    await supabase.from("policy_notices").insert([
      {
        policy_id: notice.policies.id,
        due_date: nextDueDate.toISOString().split("T")[0],
        status: "avisar",
        paid_installments: 0,
      },
    ])

    const { data: updatedNotice } = await supabase
      .from("policy_notices")
      .select(`*, policies(*, clients(id, full_name, phone, email), companies(id, name))`)
      .eq("id", noticeId)
      .single()

    revalidatePath("/avisos")
    revalidatePath("/dashboard")
    return { data: updatedNotice }
  } catch {
    return { error: "Error inesperado al procesar el pago" }
  }
}

export async function resetExpiredNotices() {
  try {
    const supabase = await createServerClient()
    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

    const { data: noticesToReset, error: fetchError } = await supabase
      .from("policy_notices")
      .select("*")
      .eq("status", "pagado")
      .is("deleted_at", null)
      .lte("due_date", fifteenDaysFromNow.toISOString().split("T")[0])

    if (fetchError) return { error: "Error al obtener avisos para resetear" }

    if (noticesToReset && noticesToReset.length > 0) {
      const { error: updateError } = await supabase
        .from("policy_notices")
        .update({ status: "avisar" })
        .in("id", noticesToReset.map((n) => n.id))

      if (updateError) return { error: "Error al resetear avisos" }
    }

    revalidatePath("/avisos")
    return { data: noticesToReset }
  } catch {
    return { error: "Error inesperado al resetear avisos" }
  }
}

// Soft delete instead of hard delete — preserves stats
export async function cleanupExpiredNotices() {
  try {
    const supabase = await createServerClient()
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    const { data: expiredNotices, error: fetchError } = await supabase
      .from("policy_notices")
      .select("id")
      .eq("status", "pagado")
      .is("deleted_at", null)
      .lt("due_date", fifteenDaysAgo.toISOString().split("T")[0])

    if (fetchError || !expiredNotices?.length) return { data: [] }

    const { error: softDeleteError } = await supabase
      .from("policy_notices")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", expiredNotices.map((n) => n.id))

    if (softDeleteError) return { error: "Error al limpiar avisos vencidos" }

    revalidatePath("/avisos")
    return { data: expiredNotices }
  } catch {
    return { error: "Error inesperado al limpiar avisos vencidos" }
  }
}

export async function getNoticesForDisplay() {
  try {
    const supabase = await createServerClient()
    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

    const { data: notices, error } = await supabase
      .from("policy_notices")
      .select(`
        *,
        policies (
          *,
          clients (id, full_name, phone, email, locality, notes),
          companies (id, name)
        ),
        notice_notes (id, note, created_at, user_profiles (display_name))
      `)
      .is("deleted_at", null)
      .or(
        `status.eq.avisado,status.eq.pagado,and(status.eq.avisar,due_date.lte.${
          fifteenDaysFromNow.toISOString().split("T")[0]
        })`
      )
      .order("due_date", { ascending: true })

    if (error) return { error: "Error al obtener los avisos" }

    await cleanupExpiredNotices()
    return { data: notices || [] }
  } catch {
    return { error: "Error inesperado al obtener avisos" }
  }
}

export async function getNoticesFiltered(filters: NoticeFilters) {
  try {
    const supabase = await createServerClient()
    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

    let query = supabase
      .from("policy_notices")
      .select(`
        *,
        policies (
          *,
          clients (id, full_name, phone, email, locality, notes),
          companies (id, name)
        ),
        notice_notes (id, note, created_at, user_profiles (display_name))
      `)
      .is("deleted_at", null)
      .order("due_date", { ascending: true })

    // Status filter
    if (!filters.status || filters.status === "todos") {
      query = query.or(
        `status.eq.avisado,status.eq.pagado,and(status.eq.avisar,due_date.lte.${
          fifteenDaysFromNow.toISOString().split("T")[0]
        })`
      )
    } else {
      query = query.eq("status", filters.status)
    }

    // Date range
    if (filters.dateFrom) query = query.gte("due_date", filters.dateFrom)
    if (filters.dateTo) query = query.lte("due_date", filters.dateTo)

    const { data: notices, error } = await query

    if (error) return { error: "Error al obtener los avisos" }

    let filtered = notices ?? []

    // Client-side filters on nested fields
    if (filters.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter((n: any) => {
        const client = n.policies?.clients
        const policy = n.policies
        return (
          client?.full_name?.toLowerCase().includes(s) ||
          policy?.policy_number?.toLowerCase().includes(s) ||
          policy?.vehicle_plate?.toLowerCase().includes(s)
        )
      })
    }
    if (filters.clientId) {
      filtered = filtered.filter((n: any) => n.policies?.clients?.id === filters.clientId)
    }
    if (filters.policyNumber) {
      const pn = filters.policyNumber.toLowerCase()
      filtered = filtered.filter((n: any) =>
        n.policies?.policy_number?.toLowerCase().includes(pn)
      )
    }
    if (filters.vehiclePlate) {
      const vp = filters.vehiclePlate.toLowerCase()
      filtered = filtered.filter((n: any) =>
        n.policies?.vehicle_plate?.toLowerCase().includes(vp)
      )
    }
    if (filters.companyId) {
      filtered = filtered.filter((n: any) => n.policies?.companies?.id === filters.companyId)
    }
    if (filters.branch) {
      filtered = filtered.filter((n: any) => n.policies?.branch === filters.branch)
    }

    return { data: filtered }
  } catch {
    return { error: "Error inesperado al obtener avisos" }
  }
}

export async function upsertNoticeNote(noticeId: string, noteText: string, noteId?: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Usuario no autenticado." }

    const { data, error } = await supabase
      .from("notice_notes")
      .upsert({ id: noteId, notice_id: noticeId, user_id: user.id, note: noteText })
      .select(`*, user_profiles(display_name)`)
      .single()

    if (error) return { error: "No se pudo guardar la nota." }

    revalidatePath("/avisos")
    return { data }
  } catch {
    return { error: "Error inesperado al guardar la nota." }
  }
}

export async function deleteNoticeNote(noteId: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Usuario no autenticado." }

    const { error } = await supabase
      .from("notice_notes")
      .delete()
      .match({ id: noteId, user_id: user.id })

    if (error) return { error: "No se pudo eliminar la nota." }

    revalidatePath("/avisos")
    return { data: { success: true } }
  } catch {
    return { error: "Error inesperado al eliminar la nota." }
  }
}

export async function addNoteToNotice(noticeId: string, note: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Usuario no autenticado" }

    const { data, error } = await supabase
      .from("notice_notes")
      .insert({ notice_id: noticeId, user_id: user.id, note })
      .select(`id, note, created_at, user_profiles(display_name)`)
      .single()

    if (error) return { error: "Error al agregar la nota" }

    revalidatePath("/avisos")
    return { data }
  } catch {
    return { error: "Error inesperado al agregar la nota" }
  }
}

export async function deleteNoteFromNotice(noteId: string) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from("notice_notes").delete().eq("id", noteId)
    if (error) return { error: "Error al eliminar la nota" }
    revalidatePath("/avisos")
    return { success: true }
  } catch {
    return { error: "Error inesperado al eliminar la nota" }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return { error: "Usuario no autenticado" }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()

    return {
      data: {
        ...user,
        display_name: profile?.display_name || user.email?.split("@")[0] || "Usuario",
      },
    }
  } catch {
    return { error: "Error al obtener usuario" }
  }
}
