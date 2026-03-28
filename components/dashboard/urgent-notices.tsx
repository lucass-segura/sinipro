"use client"

import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Car, Bike, Shield, Home, Store, Heart, UserCheck, MoreHorizontal, ArrowRight, CalendarDays } from "lucide-react"

const branchIcons: Record<string, React.ElementType> = {
  Automotores: Car,
  Motovehiculos: Bike,
  "Responsabilidad civil": Shield,
  Hogar: Home,
  Comercio: Store,
  Vida: Heart,
  "Accidentes Personales": UserCheck,
  Otro: MoreHorizontal,
}

const branchColors: Record<string, { bg: string; color: string }> = {
  Automotores:             { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  Motovehiculos:           { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  Hogar:                   { bg: "rgba(168,85,247,0.12)",  color: "#c084fc" },
  Comercio:                { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  Vida:                    { bg: "rgba(236,72,153,0.12)",  color: "#f472b6" },
  "Accidentes Personales": { bg: "rgba(139,92,246,0.12)",  color: "#a78bfa" },
  "Responsabilidad civil": { bg: "rgba(20,184,166,0.12)",  color: "#2dd4bf" },
  Otro:                    { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" },
}

function getDays(dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(dueDate + "T00:00:00"); due.setHours(0,0,0,0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function dueLabel(days: number) {
  if (days < 0) return `Vencido`
  if (days === 0) return "Hoy"
  if (days === 1) return "Mañana"
  return `${days}d`
}

interface UrgentNotice {
  id: string
  due_date: string
  status: "avisar" | "avisado" | "pagado"
  policies: {
    branch: string
    vehicle_plate?: string
    policy_number?: string
    clients: { id: string; full_name: string }
    companies: { id: string; name: string }
  } | null
}

export function UrgentNotices({ notices }: { notices: UrgentNotice[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--sp-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--sp-text)" }}>
          Avisos más urgentes
        </h3>
        <Link
          href="/avisos"
          className="flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "var(--sp-accent)" }}
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      {notices.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: "var(--sp-text-faint)" }}>
          No hay avisos urgentes
        </p>
      ) : (
        <ul>
          {notices.map((n) => {
            const Icon = branchIcons[n.policies?.branch ?? ""] ?? Shield
            const branchColor = branchColors[n.policies?.branch ?? ""] ?? branchColors["Otro"]
            const days = getDays(n.due_date)
            const isOverdue = days < 0
            const isUrgent = days <= 3

            return (
              <li
                key={n.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{ borderBottom: "1px solid var(--sp-border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: branchColor.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: branchColor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--sp-text)" }}>
                    {n.policies?.clients?.full_name}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--sp-text-muted)" }}>
                    {n.policies?.branch}
                    {n.policies?.vehicle_plate && ` · ${n.policies.vehicle_plate}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CalendarDays className="h-3 w-3" style={{ color: isOverdue ? "var(--sp-red)" : isUrgent ? "var(--sp-amber)" : "var(--sp-text-muted)" }} />
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: isOverdue ? "var(--sp-red)" : isUrgent ? "var(--sp-amber)" : "var(--sp-text-muted)" }}
                  >
                    {dueLabel(days)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
