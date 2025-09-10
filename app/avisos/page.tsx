import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { NoticesSection } from "@/components/notices-section"
import { getNoticesForDisplay } from "@/app/actions/notices"

export default async function AvisosPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const noticesResult = await getNoticesForDisplay()

  if (noticesResult.error) {
    console.error("Error fetching notices:", noticesResult.error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Avisos</h1>
            <p className="text-muted-foreground mt-2">
              Administra los avisos de vencimiento de pólizas y su estado de pago.
            </p>
          </div>
          <NoticesSection notices={noticesResult.data || []} />
        </div>
      </main>
    </div>
  )
}
