"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Phone, Mail, MapPin, FileText, Pencil, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { ClientDialog } from "@/components/client-dialog"
import { SpPagination } from "@/components/ui/sp-pagination"

const PAGE_SIZE = 10

const BRANCH_TAG = { bg: "var(--sp-surface-low)", text: "var(--sp-text-muted)", border: "var(--sp-border)" }
function getBranchStyle(_branch: string) { return BRANCH_TAG }

interface Policy {
  id?: string
  branch: string
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
  company_id: string
  companies?: { id: string; name: string }
}

interface Client {
  id: string
  full_name: string
  phone?: string
  email?: string
  locality?: string
  dni?: string
  address?: string
  birth_date?: string
  notes?: string
  created_at: string
  policies: Policy[]
}

interface Company { id: string; name: string }
interface ClientsSectionProps { clients: Client[]; companies: Company[] }

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  "#1d4ed8", "#b91c1c", "#0369a1", "#3730a3", "#047857",
  "#7c3aed", "#c2410c", "#0f766e", "#9333ea", "#be185d",
]

export function ClientsSection({ clients: initialClients, companies }: ClientsSectionProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "list"
    return (localStorage.getItem("sp-clients-view") as "grid" | "list") ?? "list"
  })
  const [page, setPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleSetView = (v: "grid" | "list") => {
    setView(v)
    setPage(1)
    if (typeof window !== "undefined") localStorage.setItem("sp-clients-view", v)
  }

  const handleSearch = (v: string) => { setSearchTerm(v); setPage(1) }

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients
    const term = searchTerm.toLowerCase()
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.locality?.toLowerCase().includes(term),
    )
  }, [clients, searchTerm])

  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE)
  const paginated = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleAddClient = () => { setEditingClient(null); setIsDialogOpen(true) }
  const handleEditClient = (c: Client) => { setEditingClient(c); setIsDialogOpen(true) }

  const handleClientUpdate = (updated: Client) => {
    if (editingClient) {
      setClients(clients.map((c) => (c.id === updated.id ? updated : c)))
    } else {
      setClients([...clients, updated])
    }
    setIsDialogOpen(false)
    setEditingClient(null)
  }

  return (
    <div className="px-8 py-8">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar asegurados..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
            style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border-strong)", color: "var(--sp-text)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        </div>

        <div className="flex-1" />

        <span className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
          {filteredClients.length} de {clients.length}
        </span>

        {/* View toggle */}
        <div className="flex p-1 rounded-lg" style={{ backgroundColor: "var(--sp-surface-low)" }}>
          <button
            onClick={() => handleSetView("grid")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
            style={{ cursor: "pointer", ...(view === "grid" ? { backgroundColor: "var(--sp-accent)", color: "#fff" } : { color: "var(--sp-text-muted)" }) }}
          >
            <LayoutGrid className="h-3.5 w-3.5" />Grid
          </button>
          <button
            onClick={() => handleSetView("list")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
            style={{ cursor: "pointer", ...(view === "list" ? { backgroundColor: "var(--sp-accent)", color: "#fff" } : { color: "var(--sp-text-muted)" }) }}
          >
            <List className="h-3.5 w-3.5" />Lista
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={handleAddClient}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ cursor: "pointer", background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar Cliente
        </button>
      </div>

      {/* Content */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--sp-text-faint)" }}>
          <Search className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">
            {searchTerm ? "No se encontraron asegurados" : "No hay asegurados registrados"}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((client, idx) => {
            const initials = getInitials(client.full_name)
            const avatarColor = AVATAR_COLORS[(filteredClients.indexOf(client)) % AVATAR_COLORS.length]
            const activePolicies = client.policies?.filter((p) => p) ?? []
            return (
              <div
                key={client.id}
                className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200"
                style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface)")}
              >
                <div className="p-5 flex-grow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: avatarColor, color: "#fff" }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold leading-tight truncate" style={{ color: "var(--sp-text)" }}>{client.full_name}</h3>
                      {client.locality && (
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                          <MapPin className="h-3 w-3 shrink-0" />{client.locality}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditClient(client)}
                      title="Editar"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-accent-text)"; e.currentTarget.style.backgroundColor = "var(--sp-accent-soft)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-muted)"; e.currentTarget.style.backgroundColor = "transparent" }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--sp-text-muted)" }}>
                        <Phone className="h-3.5 w-3.5 shrink-0" /><span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--sp-text-muted)" }}>
                        <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-3" style={{ borderTop: "1px solid var(--sp-border)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--sp-text-muted)" }}>Pólizas ({activePolicies.length})</span>
                    </div>
                    {activePolicies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activePolicies.slice(0, 3).map((policy, pi) => {
                          const bStyle = getBranchStyle(policy.branch)
                          return (
                            <span key={pi} className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}` }}>
                              {policy.branch}
                            </span>
                          )
                        })}
                        {activePolicies.length > 3 && (
                          <span className="text-[10px] font-medium" style={{ color: "var(--sp-text-muted)" }}>+{activePolicies.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--sp-text-faint)" }}>Sin pólizas</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/asegurados/${client.id}`}
                  className="flex items-center justify-center px-5 py-2.5 text-xs font-medium transition-all"
                  style={{ backgroundColor: "var(--sp-surface-lowest)", borderTop: "1px solid var(--sp-border)", color: "var(--sp-accent-text)", cursor: "pointer" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent-soft)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-surface-lowest)")}
                >
                  Ver detalle →
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
          {paginated.map((client, idx) => {
            const initials = getInitials(client.full_name)
            const avatarColor = AVATAR_COLORS[(filteredClients.indexOf(client)) % AVATAR_COLORS.length]
            const activePolicies = client.policies?.filter((p) => p) ?? []
            return (
              <div
                key={client.id}
                className="flex items-center gap-4 px-5 py-3 group transition-all"
                style={{ backgroundColor: "var(--sp-surface)", borderBottom: idx < paginated.length - 1 ? "1px solid var(--sp-border)" : undefined }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface)")}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: avatarColor, color: "#fff" }}>
                  {initials}
                </div>
                <div className="w-48 shrink-0 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--sp-text)" }}>{client.full_name}</p>
                  {client.locality && (
                    <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--sp-text-muted)" }}>
                      <MapPin className="h-2.5 w-2.5 shrink-0" />{client.locality}
                    </p>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  {client.phone && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
                      <Phone className="h-3 w-3 shrink-0" /><span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
                      <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activePolicies.length === 0 ? (
                    <span className="text-[11px]" style={{ color: "var(--sp-text-faint)" }}>Sin pólizas</span>
                  ) : (
                    <>
                      {activePolicies.slice(0, 2).map((policy, pi) => {
                        const bStyle = getBranchStyle(policy.branch)
                        return (
                          <span key={pi} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}` }}>
                            {policy.branch}
                          </span>
                        )
                      })}
                      {activePolicies.length > 2 && (
                        <span className="text-[10px]" style={{ color: "var(--sp-text-muted)" }}>+{activePolicies.length - 2}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditClient(client)}
                    title="Editar"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                    style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-accent-text)"; e.currentTarget.style.backgroundColor = "var(--sp-accent-soft)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-muted)"; e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href={`/asegurados/${client.id}`}
                    className="text-[11px] font-medium px-2.5 py-1 rounded transition-all"
                    style={{ cursor: "pointer", backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent-text)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent-soft)"; (e.currentTarget as HTMLElement).style.color = "var(--sp-accent-text)" }}
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <SpPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredClients.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Dialog */}
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
