"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ClientData {
  full_name: string
  phone?: string
  email?: string
  locality?: string
}

interface PolicyData {
  id?: string
  branch: string
  vehicle_plate?: string
  first_payment_date: string
  company_id: string
}

export async function createClient(clientData: ClientData, policies: PolicyData[] = []) {
  try {
    const supabase = await createSupabaseClient()

    // Create client
    const { data: client, error: clientError } = await supabase.from("clients").insert([clientData]).select().single()

    if (clientError) {
      return { error: "Error al crear el cliente" }
    }

    // Create policies if any
    if (policies.length > 0) {
      const policiesWithClientId = policies.map((policy) => ({
        ...policy,
        client_id: client.id,
        vehicle_plate: policy.vehicle_plate || null,
      }))

      const { error: policiesError } = await supabase.from("policies").insert(policiesWithClientId)

      if (policiesError) {
        // If policies fail, we should ideally rollback the client creation
        // For now, we'll return the client without policies
        console.error("Error creating policies:", policiesError)
      }
    }

    // Fetch the complete client with policies and companies
    const { data: completeClient, error: fetchError } = await supabase
      .from("clients")
      .select(`
        *,
        policies (
          *,
          companies (
            id,
            name
          )
        )
      `)
      .eq("id", client.id)
      .single()

    if (fetchError) {
      return { error: "Error al obtener los datos del cliente" }
    }

    revalidatePath("/asegurados")
    return { data: completeClient }
  } catch (error) {
    return { error: "Error inesperado al crear el cliente" }
  }
}

export async function updateClient(clientId: string, clientData: ClientData, policies: PolicyData[] = []) {
  try {
    const supabase = await createSupabaseClient()

    // Update client
    const { error: clientError } = await supabase.from("clients").update(clientData).eq("id", clientId)

    if (clientError) {
      return { error: "Error al actualizar el cliente" }
    }

    // Get existing policies
    const { data: existingPolicies } = await supabase.from("policies").select("id").eq("client_id", clientId)

    const existingPolicyIds = existingPolicies?.map((p) => p.id) || []

    // Separate new and existing policies
    const newPolicies = policies.filter((p) => !p.id)
    const updatedPolicies = policies.filter((p) => p.id)
    const updatedPolicyIds = updatedPolicies.map((p) => p.id)

    // Delete policies that are no longer in the list
    const policiesToDelete = existingPolicyIds.filter((id) => !updatedPolicyIds.includes(id))
    if (policiesToDelete.length > 0) {
      await supabase.from("policies").delete().in("id", policiesToDelete)
    }

    // Update existing policies
    for (const policy of updatedPolicies) {
      await supabase
        .from("policies")
        .update({
          branch: policy.branch,
          vehicle_plate: policy.vehicle_plate || null,
          first_payment_date: policy.first_payment_date,
          company_id: policy.company_id,
        })
        .eq("id", policy.id)
    }

    // Create new policies
    if (newPolicies.length > 0) {
      const policiesWithClientId = newPolicies.map((policy) => ({
        ...policy,
        client_id: clientId,
        vehicle_plate: policy.vehicle_plate || null,
      }))

      await supabase.from("policies").insert(policiesWithClientId)
    }

    // Fetch the complete updated client
    const { data: completeClient, error: fetchError } = await supabase
      .from("clients")
      .select(`
        *,
        policies (
          *,
          companies (
            id,
            name
          )
        )
      `)
      .eq("id", clientId)
      .single()

    if (fetchError) {
      return { error: "Error al obtener los datos actualizados del cliente" }
    }

    revalidatePath("/asegurados")
    return { data: completeClient }
  } catch (error) {
    return { error: "Error inesperado al actualizar el cliente" }
  }
}
