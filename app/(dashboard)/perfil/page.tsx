import { createClient } from "@/lib/supabase/server"
import { ProfileClient } from "@/components/profile-client"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--sp-bg)" }}>
      {/* Sticky topbar */}
      <header
        className="sticky top-0 z-40 flex items-center px-8 h-16"
        style={{
          backgroundColor: "var(--sp-header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--sp-border)",
        }}
      >
        <h1 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
          Mi Perfil
        </h1>
      </header>

      <ProfileClient
        initialDisplayName={profile?.display_name ?? ""}
        email={user?.email ?? ""}
      />
    </div>
  )
}
