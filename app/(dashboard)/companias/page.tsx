import { createClient } from "@/lib/supabase/server"
import { CompaniesSection } from "@/components/companies-section"

export default async function CompaniasPage() {
  const supabase = await createClient()

  const [companiesResult, policiesResult] = await Promise.all([
    supabase.from("companies").select("*").order("name"),
    supabase.from("policies").select("company_id").eq("is_active", true),
  ])

  const companies = companiesResult.data || []

  // Build policy count map per company
  const policyCountMap: Record<string, number> = {}
  for (const p of policiesResult.data || []) {
    if (p.company_id) {
      policyCountMap[p.company_id] = (policyCountMap[p.company_id] || 0) + 1
    }
  }

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
            Compañías
          </h1>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--sp-surface-hover)",
              color: "var(--sp-accent)",
              border: "1px solid var(--sp-border-strong)",
            }}
          >
            ({companies.length})
          </span>
        </div>
      </header>

      {/* Content */}
      <CompaniesSection companies={companies} policyCountMap={policyCountMap} />
    </div>
  )
}
