import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUsers } from "@/app/actions/users"
import { UsersManager } from "@/components/admin/users-manager"
import { Shield } from "lucide-react"

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect("/auth/login")

  // Verify admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: users = [] } = await getUsers()

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--sp-bg)" }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-8 h-16"
        style={{
          backgroundColor: "var(--sp-header-bg)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(139,92,246,0.15)" }}
          >
            <Shield className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
          </div>
          <h1 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
            Gestión de Usuarios
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-8 py-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-sm" style={{ color: "var(--sp-text-muted)" }}>
            Administrá los usuarios del sistema. Podés cambiar roles e invitar nuevos usuarios por email.
          </p>
        </div>
        <UsersManager
          initialUsers={users}
          currentUserId={authData.user.id}
        />
      </div>
    </div>
  )
}
