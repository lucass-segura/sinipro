"use server"

import { createServerClient } from "@/lib/supabase/server"
import type { DashboardStats } from "@/types"

export async function getUrgentNoticesCount() {
  try {
    const supabase = await createServerClient()
    const today = new Date().toISOString().split("T")[0]
    const in15 = new Date(); in15.setDate(in15.getDate() + 15)
    const in15str = in15.toISOString().split("T")[0]

    const { count, error } = await supabase
      .from("policy_notices")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .or(`and(status.eq.avisar,due_date.lt.${today}),status.eq.avisado,and(status.eq.avisar,due_date.lte.${in15str})`)

    if (error) return { count: 0 }
    return { count: count ?? 0 }
  } catch {
    return { count: 0 }
  }
}

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error?: string }> {
  try {
    const supabase = await createServerClient()
    const today = new Date().toISOString().split("T")[0]
    const in15 = new Date(); in15.setDate(in15.getDate() + 15)
    const in15str = in15.toISOString().split("T")[0]
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const lastOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]

    const [overdueRes, upcomingRes, notifiedRes, paidRes, policiesRes, clientsRes] = await Promise.all([
      // Retrasados: status avisar y vencidos
      supabase.from("policy_notices").select("*", { count: "exact", head: true })
        .is("deleted_at", null).eq("status", "avisar").lt("due_date", today),
      // Próximos: status avisar, vencen en 15 días
      supabase.from("policy_notices").select("*", { count: "exact", head: true })
        .is("deleted_at", null).eq("status", "avisar")
        .gte("due_date", today).lte("due_date", in15str),
      // Avisados sin pago
      supabase.from("policy_notices").select("*", { count: "exact", head: true })
        .is("deleted_at", null).eq("status", "avisado"),
      // Pagados este mes
      supabase.from("policy_notices").select("*", { count: "exact", head: true })
        .is("deleted_at", null).eq("status", "pagado")
        .gte("updated_at", firstOfMonth).lte("updated_at", lastOfMonth + "T23:59:59"),
      // Pólizas vigentes
      supabase.from("policies").select("*", { count: "exact", head: true }).eq("is_active", true),
      // Asegurados
      supabase.from("clients").select("*", { count: "exact", head: true }),
    ])

    return {
      data: {
        overdueNotices: overdueRes.count ?? 0,
        upcomingNotices: upcomingRes.count ?? 0,
        notifiedNoPay: notifiedRes.count ?? 0,
        paidThisMonth: paidRes.count ?? 0,
        activePolicies: policiesRes.count ?? 0,
        activeClients: clientsRes.count ?? 0,
      },
    }
  } catch {
    return { data: null, error: "Error al obtener estadísticas" }
  }
}

export async function getUrgentNoticesList() {
  try {
    const supabase = await createServerClient()
    const in15 = new Date(); in15.setDate(in15.getDate() + 15)

    const { data, error } = await supabase
      .from("policy_notices")
      .select(`id, due_date, status, notified_by,
        policies(branch, vehicle_plate, policy_number,
          clients(id, full_name), companies(id, name))`)
      .is("deleted_at", null)
      .or(`status.eq.avisado,and(status.eq.avisar,due_date.lte.${in15.toISOString().split("T")[0]})`)
      .order("due_date", { ascending: true })
      .limit(8)

    if (error) return { data: [] }
    return { data: data ?? [] }
  } catch {
    return { data: [] }
  }
}

export async function getRecentActivity() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("policy_notices")
      .select(`id, status, notified_by, updated_at,
        policies(branch, clients(full_name))`)
      .is("deleted_at", null).not("status", "eq", "avisar")
      .order("updated_at", { ascending: false }).limit(6)

    if (error) return { data: [] }
    return { data: data ?? [] }
  } catch {
    return { data: [] }
  }
}
