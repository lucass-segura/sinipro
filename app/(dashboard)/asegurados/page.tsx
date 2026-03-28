import { createClient } from "@/lib/supabase/server"
import { ClientsSection } from "@/components/clients-section"

export default async function AseguradosPage() {
  const supabase = await createClient()

  const [clientsRes, companiesRes] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        *,
        policies (
          *,
          companies (id, name)
        )
      `)
      .order("full_name"),
    supabase.from("companies").select("*").order("name"),
  ])

  const total = clientsRes.data?.length ?? 0

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
            Asegurados
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
      </header>

      {/* Content */}
      <ClientsSection
        clients={clientsRes.data || []}
        companies={companiesRes.data || []}
      />
    </div>
  )
}
