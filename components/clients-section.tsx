"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users, Edit, FileText } from "lucide-react"
import { ClientDialog } from "@/components/client-dialog"

interface Policy {
  id: string
  branch: string
  vehicle_plate?: string
  first_payment_date: string
  companies: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  full_name: string
  phone?: string
  email?: string
  locality?: string
  created_at: string
  policies: Policy[]
}

interface Company {
  id: string
  name: string
}

interface ClientsSectionProps {
  clients: Client[]
  companies: Company[]
}

export function ClientsSection({ clients: initialClients, companies }: ClientsSectionProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients

    const term = searchTerm.toLowerCase()
    return clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.includes(term) ||
        client.locality?.toLowerCase().includes(term),
    )
  }, [clients, searchTerm])

  const handleAddClient = () => {
    setEditingClient(null)
    setIsDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleClientUpdate = (updatedClient: Client) => {
    if (editingClient) {
      setClients(clients.map((c) => (c.id === updatedClient.id ? updatedClient : c)))
    } else {
      setClients([...clients, updatedClient])
    }
    setIsDialogOpen(false)
    setEditingClient(null)
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar asegurados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddClient} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Cliente
        </Button>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm
                ? "Intenta con otros términos de búsqueda."
                : "Comienza agregando tu primer cliente al sistema."}
            </p>
            {!searchTerm && (
              <Button onClick={handleAddClient} variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Agregar Primer Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{client.full_name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="text-foreground">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Teléfono: </span>
                    <span className="text-foreground">{client.phone}</span>
                  </div>
                )}
                {client.locality && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Localidad: </span>
                    <span className="text-foreground">{client.locality}</span>
                  </div>
                )}

                {/* Policies */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Pólizas ({client.policies.length})
                    </span>
                  </div>
                  {client.policies.length > 0 ? (
                    <div className="space-y-1">
                      {client.policies.slice(0, 2).map((policy) => (
                        <div key={policy.id} className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {policy.branch}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{policy.companies.name}</span>
                        </div>
                      ))}
                      {client.policies.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{client.policies.length - 2} más</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin pólizas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Client Dialog */}
      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={editingClient}
        companies={companies}
        onSuccess={handleClientUpdate}
      />
    </div>
  )
}
