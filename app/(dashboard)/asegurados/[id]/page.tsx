import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientDetailView } from "@/components/asegurados/client-detail-view"

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ poliza?: string }>
}) {
  const { id } = await params
  const { poliza } = await searchParams
  const supabase = await createClient()

  const [clientRes, policiesRes, companiesRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("policies")
      .select("*, companies(id, name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ])

  if (clientRes.error || !clientRes.data) notFound()

  const client = {
    ...clientRes.data,
    policies: policiesRes.data ?? [],
  }

  return (
    <ClientDetailView
      initialClient={client}
      initialPolicies={policiesRes.data ?? []}
      companies={companiesRes.data ?? []}
      initialPolicyId={poliza}
    />
  )
}
