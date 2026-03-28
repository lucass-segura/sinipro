import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { getUrgentNoticesCount } from "@/app/actions/dashboard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role")
    .eq("id", data.user.id)
    .single()

  if (!profile) {
    redirect("/setup-profile")
  }

  const { count: urgentCount } = await getUrgentNoticesCount()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar urgentCount={urgentCount ?? 0} role={profile.role ?? "broker"} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
