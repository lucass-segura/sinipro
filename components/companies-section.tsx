"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Edit } from "lucide-react"
import { CompanyDialog } from "@/components/company-dialog"

interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface CompaniesSectionProps {
  companies: Company[]
}

export function CompaniesSection({ companies: initialCompanies }: CompaniesSectionProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const handleAddCompany = () => {
    setEditingCompany(null)
    setIsDialogOpen(true)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setIsDialogOpen(true)
  }

  const handleCompanyUpdate = (updatedCompany: Company) => {
    if (editingCompany) {
      // Update existing company
      setCompanies(companies.map((c) => (c.id === updatedCompany.id ? updatedCompany : c)))
    } else {
      // Add new company
      setCompanies([...companies, updatedCompany])
    }
    setIsDialogOpen(false)
    setEditingCompany(null)
  }

  return (
    <div className="space-y-6">
      {/* Add Company Button */}
      <div className="flex justify-start">
        <Button onClick={handleAddCompany} className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Compañía
        </Button>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay compañías registradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primera compañía de seguros al sistema.
            </p>
            <Button onClick={handleAddCompany} variant="outline" className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Añadir Primera Compañía
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEditCompany(company)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Activa
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registrada:</span>
                    <span className="text-foreground">{new Date(company.created_at).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Dialog */}
      <CompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        company={editingCompany}
        onSuccess={handleCompanyUpdate}
      />
    </div>
  )
}
