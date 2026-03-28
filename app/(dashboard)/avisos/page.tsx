import { createClient } from "@/lib/supabase/server"
import { NoticesSection } from "@/components/notices-section"
import { getNoticesForDisplay } from "@/app/actions/notices"
import { PolicyDialog } from "@/components/polizas/policy-dialog"

export default async function AvisosPage() {
  const supabase = await createClient()

  const [noticesResult, companiesResult] = await Promise.all([
    getNoticesForDisplay(),
    supabase.from("companies").select("id, name").order("name"),
  ])

  const total = noticesResult.data?.length ?? 0

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: "var(--sp-bg)" }}>
      {/* Header */}
      <header
        className="shrink-0 z-40 flex items-center justify-between px-6 h-14"
        style={{
          backgroundColor: "var(--sp-header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--sp-text)" }}
          >
            Avisos
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

        <PolicyDialog companies={companiesResult.data ?? []} />
      </header>

      {/* Content — flex-1 so kanban columns fill remaining height */}
      <div className="flex-1 min-h-0">
        <NoticesSection
          notices={noticesResult.data || []}
          companies={companiesResult.data || []}
        />
      </div>
    </div>
  )
}
