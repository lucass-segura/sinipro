import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { CompaniesSection } from "@/components/companies-section"

export default async function CompaniasPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: companies, error: companiesError } = await supabase.from("companies").select("*").order("name")

  if (companiesError) {
    console.error("Error fetching companies:", companiesError)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestión de Compañías</h1>
              <p className="text-muted-foreground mt-2">
                Administra las compañías de seguros registradas en el sistema.
              </p>
            </div>
          </div>
          <CompaniesSection companies={companies || []} />
        </div>
      </main>
    </div>
  )
}
