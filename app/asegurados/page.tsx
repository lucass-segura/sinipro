import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { ClientsSection } from "@/components/clients-section"

export default async function AseguradosPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch clients with their policies and companies
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(`
      *,
      policies (
        *,
        companies (
          id,
          name
        )
      )
    `)
    .order("full_name")

  const { data: companies, error: companiesError } = await supabase.from("companies").select("*").order("name")

  if (clientsError) {
    console.error("Error fetching clients:", clientsError)
  }

  if (companiesError) {
    console.error("Error fetching companies:", companiesError)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Asegurados</h1>
            <p className="text-muted-foreground mt-2">Administra los clientes y sus pólizas de seguros.</p>
          </div>
          <ClientsSection clients={clients || []} companies={companies || []} />
        </div>
      </main>
    </div>
  )
}
