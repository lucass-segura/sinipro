import { createClient } from "@/lib/supabase/server"
import { getDashboardStats, getUrgentNoticesList, getRecentActivity } from "@/app/actions/dashboard"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { UrgentNotices } from "@/components/dashboard/urgent-notices"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import Link from "next/link"
import { Bell, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single()

  const [statsRes, urgentRes, activityRes] = await Promise.all([
    getDashboardStats(),
    getUrgentNoticesList(),
    getRecentActivity(),
  ])

  const defaultStats = {
    overdueNotices: 0,
    upcomingNotices: 0,
    notifiedNoPay: 0,
    paidThisMonth: 0,
    activePolicies: 0,
    activeClients: 0,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
  const firstName = profile?.display_name?.split(" ")[0] ?? "Usuario"

  // Format date in Spanish
  const today = new Date()
  const dateStr = today.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--sp-bg)" }}>
      {/* Sticky header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-8 h-16"
        style={{
          backgroundColor: "var(--sp-header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--sp-border)",
        }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--sp-text-muted)" }}>
            Panel principal
          </p>
        </div>
        <Link
          href="/avisos"
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: "var(--sp-accent)" }}
        >
          <Bell className="h-3.5 w-3.5" />
          Ver avisos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      <div className="px-8 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--sp-text)" }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-1 capitalize" style={{ color: "var(--sp-text-muted)" }}>
            {dateStr}
          </p>
        </div>

        {/* Stats */}
        <StatsCards stats={statsRes.data ?? defaultStats} />

        {/* Two panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UrgentNotices notices={(urgentRes.data ?? []) as any} />
          <ActivityFeed items={(activityRes.data ?? []) as any} />
        </div>
      </div>
    </div>
  )
}
