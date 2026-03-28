import { createClient } from "@/lib/supabase/server"
import { PoliciesTable } from "@/components/polizas/policies-table"
import { PolicyDialog } from "@/components/polizas/policy-dialog"

export default async function PolizasPage() {
  const supabase = await createClient()

  const [policiesRes, companiesRes] = await Promise.all([
    supabase
      .from("policies")
      .select(`
        *,
        clients (id, full_name, phone, email),
        companies (id, name),
        policy_notices (id, due_date, status, deleted_at)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name").order("name"),
  ])

  const companies = companiesRes.data || []
  const total = policiesRes.data?.length ?? 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--sp-bg)" }}>
      {/* Sticky topbar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-8 h-16"
        style={{
          backgroundColor: "var(--sp-header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
            Pólizas
          </h1>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--sp-surface-hover)",
              color: "var(--sp-accent)",
              border: "1px solid var(--sp-border-strong)",
            }}
          >
            ({total})
          </span>
        </div>

        <PolicyDialog companies={companies} />
      </header>

      {/* Content */}
      <div className="px-8 py-6">
        <PoliciesTable
          policies={policiesRes.data || []}
          companies={companies}
        />
      </div>
    </div>
  )
}
