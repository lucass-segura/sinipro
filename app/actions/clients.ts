"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ClientData {
  full_name: string
  phone?: string
  email?: string
  locality?: string
  dni?: string
  address?: string
  birth_date?: string
  notes?: string
}

interface PolicyData {
  id?: string
  branch: string
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
  company_id: string
}

const CLIENT_SELECT = `
  *,
  policies (
    *,
    companies (id, name)
  )
`

export async function createClient(clientData: ClientData, policies: PolicyData[] = []) {
  try {
    const supabase = await createSupabaseClient()

    const cleanData = {
      ...clientData,
      birth_date: clientData.birth_date || null,
      dni: clientData.dni || null,
      address: clientData.address || null,
      notes: clientData.notes || null,
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert([cleanData])
      .select()
      .single()

    if (clientError) return { error: "Error al crear el cliente" }

    if (policies.length > 0) {
      const policiesWithClientId = policies.map((policy) => ({
        branch: policy.branch,
        vehicle_plate: policy.vehicle_plate || null,
        policy_number: policy.policy_number || null,
        first_payment_date: policy.first_payment_date,
        company_id: policy.company_id,
        client_id: client.id,
        is_active: true,
      }))

      const { error: policiesError } = await supabase.from("policies").insert(policiesWithClientId)
      if (policiesError) console.error("Error creating policies:", policiesError)
    }

    const { data: completeClient, error: fetchError } = await supabase
      .from("clients")
      .select(CLIENT_SELECT)
      .eq("id", client.id)
      .single()

    if (fetchError) return { error: "Error al obtener los datos del cliente" }

    revalidatePath("/asegurados")
    revalidatePath("/dashboard")
    return { data: completeClient }
  } catch {
    return { error: "Error inesperado al crear el cliente" }
  }
}

export async function updateClient(clientId: string, clientData: ClientData, policies: PolicyData[] = []) {
  try {
    const supabase = await createSupabaseClient()

    const cleanData = {
      ...clientData,
      birth_date: clientData.birth_date || null,
      dni: clientData.dni || null,
      address: clientData.address || null,
      notes: clientData.notes || null,
    }

    const { error: clientError } = await supabase
      .from("clients")
      .update(cleanData)
      .eq("id", clientId)

    if (clientError) return { error: "Error al actualizar el cliente" }

    const { data: existingPolicies } = await supabase
      .from("policies")
      .select("id")
      .eq("client_id", clientId)

    const existingPolicyIds = existingPolicies?.map((p) => p.id) ?? []
    const newPolicies = policies.filter((p) => !p.id)
    const updatedPolicies = policies.filter((p) => p.id)
    const updatedPolicyIds = updatedPolicies.map((p) => p.id)

    const policiesToDelete = existingPolicyIds.filter((id) => !updatedPolicyIds.includes(id))
    if (policiesToDelete.length > 0) {
      await supabase.from("policies").delete().in("id", policiesToDelete)
    }

    for (const policy of updatedPolicies) {
      await supabase
        .from("policies")
        .update({
          branch: policy.branch,
          vehicle_plate: policy.vehicle_plate || null,
          policy_number: policy.policy_number || null,
          first_payment_date: policy.first_payment_date,
          company_id: policy.company_id,
        })
        .eq("id", policy.id)
    }

    if (newPolicies.length > 0) {
      await supabase.from("policies").insert(
        newPolicies.map((policy) => ({
          branch: policy.branch,
          vehicle_plate: policy.vehicle_plate || null,
          policy_number: policy.policy_number || null,
          first_payment_date: policy.first_payment_date,
          company_id: policy.company_id,
          client_id: clientId,
          is_active: true,
        }))
      )
    }

    const { data: completeClient, error: fetchError } = await supabase
      .from("clients")
      .select(CLIENT_SELECT)
      .eq("id", clientId)
      .single()

    if (fetchError) return { error: "Error al obtener los datos actualizados del cliente" }

    revalidatePath("/asegurados")
    revalidatePath("/dashboard")
    revalidatePath("/avisos")
    return { data: completeClient }
  } catch {
    return { error: "Error inesperado al actualizar el cliente" }
  }
}
