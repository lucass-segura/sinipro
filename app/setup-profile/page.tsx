import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SetupProfileForm } from "@/components/setup-profile-form"

export default async function SetupProfilePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Verificar si ya tiene perfil
  const { data: profile } = await supabase.from("user_profiles").select("display_name").eq("id", user.id).single()

  if (profile) {
    redirect("/avisos")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Configurar Perfil</h1>
            <p className="text-slate-600">Para continuar, necesitamos que configures tu nombre de usuario</p>
          </div>

          <SetupProfileForm userEmail={user.email || ""} />
        </div>
      </div>
    </div>
  )
}
