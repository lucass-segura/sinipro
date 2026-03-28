"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPoliciesWithDetails(filters?: {
  search?: string
  branch?: string
  companyId?: string
  isActive?: boolean
}) {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from("policies")
      .select(`
        *,
        clients (id, full_name, phone, email, locality),
        companies (id, name),
        policy_notices (
          id, due_date, status, deleted_at
        )
      `)
      .order("created_at", { ascending: false })

    if (filters?.branch) query = query.eq("branch", filters.branch)
    if (filters?.companyId) query = query.eq("company_id", filters.companyId)
    if (filters?.isActive !== undefined) query = query.eq("is_active", filters.isActive)

    const { data, error } = await query

    if (error) return { error: "Error al obtener pólizas" }

    let filtered = data ?? []

    // Search filter (client name, policy number, plate)
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter(
        (p: any) =>
          p.clients?.full_name?.toLowerCase().includes(s) ||
          p.policy_number?.toLowerCase().includes(s) ||
          p.vehicle_plate?.toLowerCase().includes(s)
      )
    }

    return { data: filtered }
  } catch {
    return { error: "Error inesperado al obtener pólizas" }
  }
}

export async function togglePolicyActive(policyId: string, isActive: boolean) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from("policies")
      .update({ is_active: isActive })
      .eq("id", policyId)

    if (error) return { error: "Error al actualizar estado de póliza" }

    revalidatePath("/polizas")
    return { data: { success: true } }
  } catch {
    return { error: "Error inesperado" }
  }
}

export async function updatePolicy(
  policyId: string,
  data: {
    branch: string
    company_id: string
    policy_number?: string
    vehicle_plate?: string
    first_payment_date: string
    is_active: boolean
  }
) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from("policies")
      .update({
        branch: data.branch,
        company_id: data.company_id,
        policy_number: data.policy_number || null,
        vehicle_plate: data.vehicle_plate || null,
        first_payment_date: data.first_payment_date,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", policyId)

    if (error) return { error: "Error al actualizar la póliza" }

    revalidatePath("/asegurados")
    revalidatePath("/polizas")
    return { data: { success: true } }
  } catch {
    return { error: "Error inesperado al actualizar la póliza" }
  }
}

export async function getPolicyHistory(policyId: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("policy_notices")
      .select(`
        id, due_date, status, paid_installments, notified_by, created_at, updated_at, deleted_at,
        notice_notes (id, note, created_at, user_profiles (display_name))
      `)
      .eq("policy_id", policyId)
      .order("due_date", { ascending: false })

    if (error) return { error: "Error al obtener historial" }
    return { data: data ?? [] }
  } catch {
    return { error: "Error inesperado al obtener historial" }
  }
}

export async function createPolicy(data: {
  client_id: string
  company_id: string
  branch: string
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
}) {
  try {
    const supabase = await createServerClient()
    const { data: policy, error } = await supabase
      .from("policies")
      .insert({
        client_id: data.client_id,
        company_id: data.company_id,
        branch: data.branch,
        vehicle_plate: data.vehicle_plate || null,
        policy_number: data.policy_number || null,
        first_payment_date: data.first_payment_date,
        is_active: true,
      })
      .select()
      .single()

    if (error) return { error: "Error al crear la póliza" }

    revalidatePath("/polizas")
    revalidatePath("/asegurados")
    return { data: policy }
  } catch {
    return { error: "Error inesperado al crear la póliza" }
  }
}

export async function searchClients(query: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name, phone, email, dni")
      .or(`full_name.ilike.%${query}%,dni.ilike.%${query}%,email.ilike.%${query}%`)
      .order("full_name")
      .limit(10)
    if (error) return { data: [] }
    return { data: data ?? [] }
  } catch {
    return { data: [] }
  }
}

export async function getClientWithPoliciesAndNotices(clientId: string) {
  try {
    const supabase = await createServerClient()

    const [clientRes, policiesRes, noticesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("policies")
        .select(`*, companies(id, name)`)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("policy_notices")
        .select(`
          *,
          policies(id, branch, vehicle_plate, policy_number, companies(id, name))
        `)
        .is("deleted_at", null)
        .eq("policies.client_id", clientId)
        .order("due_date", { ascending: true }),
    ])

    if (clientRes.error) return { error: "Cliente no encontrado" }

    return {
      data: {
        client: clientRes.data,
        policies: policiesRes.data ?? [],
        notices: noticesRes.data ?? [],
      },
    }
  } catch {
    return { error: "Error inesperado al obtener datos del cliente" }
  }
}
