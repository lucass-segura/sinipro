"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import {
  Search, Car, Bike, Shield, Home, Store, Heart, UserCheck,
  MoreHorizontal, LayoutGrid, List, Hash, CalendarDays, ExternalLink,
} from "lucide-react"
import { togglePolicyActive } from "@/app/actions/policies"
import { POLICY_BRANCHES } from "@/types"
import { SpPagination } from "@/components/ui/sp-pagination"

const PAGE_SIZE = 10

const BRANCH_ICONS: Record<string, React.ElementType> = {
  Automotores: Car, Motovehiculos: Bike, "Responsabilidad civil": Shield,
  Hogar: Home, Comercio: Store, Vida: Heart, "Accidentes Personales": UserCheck, Otro: MoreHorizontal,
}

interface Policy {
  id: string
  policy_number?: string
  branch: string
  vehicle_plate?: string
  first_payment_date: string
  is_active: boolean
  clients?: { id: string; full_name: string; phone?: string; email?: string }
  companies?: { id: string; name: string }
  policy_notices?: { id: string; due_date: string; status: string; deleted_at: string | null }[]
}

interface PoliciesTableProps {
  policies: Policy[]
  companies: { id: string; name: string }[]
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  "#1d4ed8", "#b91c1c", "#0369a1", "#3730a3", "#047857",
  "#7c3aed", "#c2410c", "#0f766e", "#9333ea", "#be185d",
]

function getNextDueDate(policy: Policy) {
  const active = (policy.policy_notices ?? [])
    .filter((n) => !n.deleted_at && n.status !== "pagado")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  return active[0]?.due_date ?? null
}

export function PoliciesTable({ policies: initialPolicies, companies }: PoliciesTableProps) {
  const [policies, setPolicies] = useState(initialPolicies)
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [view, setView] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "list"
    return (localStorage.getItem("sp-policies-view") as "grid" | "list") ?? "list"
  })
  const [page, setPage] = useState(1)

  const handleSetView = (v: "grid" | "list") => {
    setView(v); setPage(1)
    if (typeof window !== "undefined") localStorage.setItem("sp-policies-view", v)
  }
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilter = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1) }

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const s = search.toLowerCase()
      const matchSearch =
        !s ||
        p.clients?.full_name?.toLowerCase().includes(s) ||
        p.policy_number?.toLowerCase().includes(s) ||
        p.vehicle_plate?.toLowerCase().includes(s)
      const matchBranch = branchFilter === "all" || p.branch === branchFilter
      const matchCompany = companyFilter === "all" || p.companies?.id === companyFilter
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active)
      return matchSearch && matchBranch && matchCompany && matchStatus
    })
  }, [policies, search, branchFilter, companyFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleToggleActive = async (policyId: string, current: boolean) => {
    setPolicies((prev) => prev.map((p) => (p.id === policyId ? { ...p, is_active: !current } : p)))
    const result = await togglePolicyActive(policyId, !current)
    if (result.error) {
      setPolicies((prev) => prev.map((p) => (p.id === policyId ? { ...p, is_active: current } : p)))
    }
  }

  const selectStyle: React.CSSProperties = {
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--sp-border-strong)",
    backgroundColor: "var(--sp-surface)",
    color: "var(--sp-text)",
    fontSize: 12,
    outline: "none",
  }

  return (
    <div className="px-8 py-8">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
          <input
            type="text"
            placeholder="Asegurado, N° póliza, patente..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
            style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border-strong)", color: "var(--sp-text)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        </div>

        {/* Filters */}
        <select value={branchFilter} onChange={(e) => handleFilter(setBranchFilter)(e.target.value)} style={selectStyle}>
          <option value="all">Todos los ramos</option>
          {POLICY_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={companyFilter} onChange={(e) => handleFilter(setCompanyFilter)(e.target.value)} style={selectStyle}>
          <option value="all">Todas las compañías</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => handleFilter(setStatusFilter)(e.target.value)} style={selectStyle}>
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>

        <div className="flex-1" />

        <span className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
          {filtered.length} de {policies.length}
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
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--sp-text-faint)" }}>
          <Search className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">No hay pólizas que coincidan con los filtros</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((policy) => {
            const Icon = BRANCH_ICONS[policy.branch] ?? Shield
            const nextDue = getNextDueDate(policy)
            const clientName = policy.clients?.full_name ?? "—"
            const initials = getInitials(clientName)
            const avatarColor = AVATAR_COLORS[clientName.charCodeAt(0) % AVATAR_COLORS.length]
            return (
              <div
                key={policy.id}
                className="group rounded-xl overflow-hidden transition-all"
                style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--sp-border-strong)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--sp-border)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)" }}
              >
                {/* Card header */}
                <div className="px-4 pt-5 pb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--sp-accent-soft)" }}>
                      <Icon className="h-4 w-4" style={{ color: "var(--sp-accent)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--sp-text)" }}>{policy.branch}</p>
                      <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>{policy.companies?.name ?? "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div className="px-4 pb-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: avatarColor, color: "#fff" }}>
                    {initials}
                  </div>
                  <Link
                    href={`/asegurados/${policy.clients?.id}`}
                    className="text-sm font-semibold truncate hover:underline"
                    style={{ color: "var(--sp-text)", textDecoration: "none" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                  >
                    {clientName}
                  </Link>
                </div>

                {/* Details */}
                <div className="px-4 pb-3 space-y-1.5">
                  {policy.policy_number && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Póliza N°</p>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sp-text-muted)" }}>
                        <Hash className="h-3 w-3 shrink-0" />{policy.policy_number}
                      </div>
                    </div>
                  )}
                  {policy.vehicle_plate && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Patente</p>
                      <div className="text-xs font-mono uppercase" style={{ color: "var(--sp-text-muted)" }}>{policy.vehicle_plate}</div>
                    </div>
                  )}
                  {nextDue && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Próx. vencimiento</p>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--sp-text-muted)" }}>
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {format(parseISO(nextDue), "d MMM yyyy", { locale: es })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: toggle + ver */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: "var(--sp-surface-lowest)", borderTop: "1px solid var(--sp-border)" }}
                >
                  <button
                    onClick={() => handleToggleActive(policy.id, policy.is_active)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={policy.is_active
                      ? { cursor: "pointer", backgroundColor: "rgba(74,225,118,0.1)", color: "var(--sp-green)", border: "1px solid rgba(74,225,118,0.3)" }
                      : { cursor: "pointer", backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: policy.is_active ? "var(--sp-green)" : "var(--sp-text-faint)" }} />
                    {policy.is_active ? "Activa" : "Inactiva"}
                  </button>
                  <Link
                    href={`/asegurados/${policy.clients?.id}?poliza=${policy.id}`}
                    className="text-[11px] font-medium px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                    style={{ backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent-text)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent-soft)"; (e.currentTarget as HTMLElement).style.color = "var(--sp-accent-text)" }}
                  >
                    Ver <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
          {paginated.map((policy, idx) => {
            const Icon = BRANCH_ICONS[policy.branch] ?? Shield
            const nextDue = getNextDueDate(policy)
            const clientName = policy.clients?.full_name ?? "—"
            const initials = getInitials(clientName)
            const avatarColor = AVATAR_COLORS[clientName.charCodeAt(0) % AVATAR_COLORS.length]
            return (
              <div
                key={policy.id}
                className="flex items-center gap-4 px-5 py-3 group transition-all"
                style={{
                  backgroundColor: "var(--sp-surface)",
                  borderBottom: idx < paginated.length - 1 ? "1px solid var(--sp-border)" : undefined,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface)")}
              >
                {/* Branch icon */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--sp-accent-soft)" }}>
                  <Icon className="h-4 w-4" style={{ color: "var(--sp-accent)" }} />
                </div>

                {/* Branch + company */}
                <div className="w-44 shrink-0 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--sp-text)" }}>{policy.branch}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--sp-text-muted)" }}>{policy.companies?.name ?? "—"}</p>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: avatarColor, color: "#fff" }}>
                    {initials}
                  </div>
                  <Link
                    href={`/asegurados/${policy.clients?.id}`}
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--sp-text)", textDecoration: "none" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                  >
                    {clientName}
                  </Link>
                </div>

                {/* Policy# + plate */}
                <div className="w-28 shrink-0 space-y-0.5">
                  {policy.policy_number && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Póliza N°</p>
                      <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--sp-text-muted)" }}>
                        <Hash className="h-3 w-3 shrink-0" />{policy.policy_number}
                      </p>
                    </div>
                  )}
                  {policy.vehicle_plate && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Patente</p>
                      <p className="text-[11px] font-mono uppercase" style={{ color: "var(--sp-text-muted)" }}>{policy.vehicle_plate}</p>
                    </div>
                  )}
                </div>

                {/* Next due */}
                <div className="w-28 shrink-0">
                  {nextDue ? (
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Próx. vencimiento</p>
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {format(parseISO(nextDue), "d MMM yyyy", { locale: es })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--sp-text-faint)" }}>Sin aviso</span>
                  )}
                </div>

                {/* Toggle + link */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(policy.id, policy.is_active)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={policy.is_active
                      ? { cursor: "pointer", backgroundColor: "rgba(74,225,118,0.1)", color: "var(--sp-green)", border: "1px solid rgba(74,225,118,0.3)" }
                      : { cursor: "pointer", backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: policy.is_active ? "var(--sp-green)" : "var(--sp-text-faint)" }} />
                    {policy.is_active ? "Activa" : "Inactiva"}
                  </button>
                  <Link
                    href={`/asegurados/${policy.clients?.id}?poliza=${policy.id}`}
                    className="text-[11px] font-medium px-2.5 py-1 rounded transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
                    style={{ cursor: "pointer", backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent-text)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--sp-accent-soft)"; (e.currentTarget as HTMLElement).style.color = "var(--sp-accent-text)" }}
                  >
                    Ver <ExternalLink className="h-3 w-3" />
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
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  )
}
