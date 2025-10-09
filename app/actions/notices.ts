"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Function to update the status of a notice
export async function updateNoticeStatus(noticeId: string, status: "avisar" | "avisado" | "pagado") {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Usuario no autenticado" }
    }

    // Prepare data for update with logic for notified_by
    const updateData: any = { status }

    if (status === "avisado") {
      const { data: profile } = await supabase.from("user_profiles").select("display_name").eq("id", user.id).single()

      if (profile?.display_name) {
        updateData.notified_by = profile.display_name
      } else {
        // Fallback al email si no hay perfil
        const userName = user.email?.split("@")[0] || "Usuario"
        updateData.notified_by = userName
      }
    } else if (status === "avisar") {
      // Clear information of who notified when status is set to "avisar"
      updateData.notified_by = null
    }
    // Maintain information of who notified when status is set to "pagado"

    if (status === "avisado") {
      // Get the current notice to verify if it's in "pagado" status
      const { data: currentNotice, error: currentError } = await supabase
        .from("policy_notices")
        .select("*, policies(id)")
        .eq("id", noticeId)
        .single()

      if (currentError || !currentNotice) {
        return { error: "Error al obtener el aviso actual" }
      }

      // If the current notice is in "pagado" status, find and delete the future notice
      if (currentNotice.status === "pagado") {
        const { data: futureNotices, error: futureError } = await supabase
          .from("policy_notices")
          .select("*")
          .eq("policy_id", currentNotice.policies.id)
          .gt("due_date", currentNotice.due_date)
          .eq("status", "avisar")

        if (!futureError && futureNotices && futureNotices.length > 0) {
          const nextNotice = futureNotices.sort(
            (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
          )[0]

          await supabase.from("policy_notices").delete().eq("id", nextNotice.id)
        }
      }
    }

    // Use updateData that includes notified_by
    const { data, error } = await supabase
      .from("policy_notices")
      .update(updateData)
      .eq("id", noticeId)
      .select()
      .single()

    if (error) {
      return { error: "Error al actualizar el estado del aviso" }
    }

    revalidatePath("/avisos")
    return { data }
  } catch (error) {
    return { error: "Error inesperado al actualizar el estado" }
  }
}

// Function to process a payment for a notice
export async function processPayment(noticeId: string, installments: number) {
  try {
    const supabase = await createServerClient()

    // Get the current notice
    const { data: notice, error: noticeError } = await supabase
      .from("policy_notices")
      .select(`
        *,
        policies (
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          companies (
            id,
            name
          )
        )
      `)
      .eq("id", noticeId)
      .single()

    if (noticeError || !notice) {
      return { error: "Error al obtener el aviso" }
    }

    // Calculate next due date by adding months to current due date
    const currentDueDate = new Date(notice.due_date)
    const nextDueDate = new Date(currentDueDate)
    nextDueDate.setMonth(nextDueDate.getMonth() + installments)

    // Update current notice to paid status
    const { error: updateError } = await supabase
      .from("policy_notices")
      .update({
        status: "pagado",
        paid_installments: installments,
      })
      .eq("id", noticeId)

    if (updateError) {
      return { error: "Error al actualizar el estado del pago" }
    }

    // Create new notice for next payment
    const { error: createError } = await supabase.from("policy_notices").insert([
      {
        policy_id: notice.policies.id,
        due_date: nextDueDate.toISOString().split("T")[0],
        status: "avisar",
        paid_installments: 0,
      },
    ])

    if (createError) {
      console.error("Error creating next notice:", createError)
      // Don't return error here as the payment was processed successfully
    }

    // Return updated notice
    const { data: updatedNotice, error: fetchError } = await supabase
      .from("policy_notices")
      .select(`
        *,
        policies (
          *,
          clients (
            id,
            full_name,
            phone,
            email
          ),
          companies (
            id,
            name
          )
        )
      `)
      .eq("id", noticeId)
      .single()

    if (fetchError) {
      return { error: "Error al obtener los datos actualizados" }
    }

    revalidatePath("/avisos")
    return { data: updatedNotice }
  } catch (error) {
    return { error: "Error inesperado al procesar el pago" }
  }
}

// Function to automatically reset notices that are 15 days before due date
export async function resetExpiredNotices() {
  try {
    const supabase = await createServerClient()

    // Calculate date 15 days from now
    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

    // Find paid notices that should be reset to avisar
    const { data: noticesToReset, error: fetchError } = await supabase
      .from("policy_notices")
      .select("*")
      .eq("status", "pagado")
      .lte("due_date", fifteenDaysFromNow.toISOString().split("T")[0])

    if (fetchError) {
      console.error("Error fetching notices to reset:", fetchError)
      return { error: "Error al obtener avisos para resetear" }
    }

    if (noticesToReset && noticesToReset.length > 0) {
      const { error: updateError } = await supabase
        .from("policy_notices")
        .update({ status: "avisar" })
        .in(
          "id",
          noticesToReset.map((n) => n.id),
        )

      if (updateError) {
        console.error("Error resetting notices:", updateError)
        return { error: "Error al resetear avisos" }
      }
    }

    revalidatePath("/avisos")
    return { data: noticesToReset }
  } catch (error) {
    return { error: "Error inesperado al resetear avisos" }
  }
}

// Function to clean up expired paid notices
export async function cleanupExpiredNotices() {
  try {
    const supabase = await createServerClient()

    // Calculate date 15 days ago
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    // Delete paid notices that have expired for 15 days
    const { data: deletedNotices, error: deleteError } = await supabase
      .from("policy_notices")
      .delete()
      .eq("status", "pagado")
      .lt("due_date", fifteenDaysAgo.toISOString().split("T")[0])
      .select()

    if (deleteError) {
      console.error("Error deleting expired paid notices:", deleteError)
      return { error: "Error al eliminar avisos pagados vencidos" }
    }

    revalidatePath("/avisos")
    return { data: deletedNotices }
  } catch (error) {
    return { error: "Error inesperado al limpiar avisos vencidos" }
  }
}

// Function to get notices for display
export async function getNoticesForDisplay() {
  try {
    const supabase = await createServerClient()

    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15)

    const { data: notices, error } = await supabase
      .from("policy_notices")
      .select(
        `
        *,
        policies (
          *,
          clients (
            id,
            full_name,
            phone,
            email,
            locality
          ),
          companies (
            id,
            name
          )
        ),
        notice_notes (
          id,
          note,
          created_at,
          user_profiles (
            display_name
          )
        )
      `,
      )
      .or(
        `status.eq.avisado,status.eq.pagado,and(status.eq.avisar,due_date.lte.${
          fifteenDaysFromNow.toISOString().split("T")[0]
        })`,
      )
      .order("due_date", { ascending: true })

    if (error) {
      // Si hay un error, lo mostramos para tener más pistas
      console.error("Error fetching notices:", error)
      return { error: "Error al obtener los avisos" }
    }

    await cleanupExpiredNotices()

    return { data: notices || [] }
  } catch (error) {
    return { error: "Error inesperado al obtener avisos" }
  }
}

export async function addNoteToNotice(noticeId: string, note: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { data, error } = await supabase
      .from("notice_notes")
      .insert({
        notice_id: noticeId,
        user_id: user.id,
        note: note,
      })
      .select(
        `
        id,
        note,
        created_at,
        user_profiles (
          display_name
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding note:", error);
      return { error: "Error al agregar la nota" };
    }
    revalidatePath("/avisos");
    return { data };
  } catch (error) {
    return { error: "Error inesperado al agregar la nota" };
  }
}

// Function to get information of the current user
export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { error: "Usuario no autenticado" }
    }

    // Obtener información del perfil del usuario
    const { data: profile } = await supabase.from("user_profiles").select("display_name").eq("id", user.id).single()

    return {
      data: {
        ...user,
        display_name: profile?.display_name || user.email?.split("@")[0] || "Usuario",
      },
    }
  } catch (error) {
    return { error: "Error al obtener usuario" }
  }
}
