"use client"

import { AlertTriangle, Clock, Bell, CheckCircle, FileText, Users } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/types"

const statConfig = [
  {
    key: "overdueNotices" as const,
    label: "Avisos urgentes",
    sublabel: "retrasados",
    icon: AlertTriangle,
    iconBg: "var(--sp-red-soft)",
    iconColor: "var(--sp-red)",
    valueColor: "var(--sp-red)",
    borderColor: "var(--sp-red)",
    href: "/avisos",
  },
  {
    key: "upcomingNotices" as const,
    label: "Avisos próximos",
    sublabel: "próximos 15 días",
    icon: Clock,
    iconBg: "var(--sp-amber-soft)",
    iconColor: "var(--sp-amber)",
    valueColor: "var(--sp-amber)",
    borderColor: "var(--sp-amber)",
    href: "/avisos",
  },
  {
    key: "notifiedNoPay" as const,
    label: "Avisados sin pago",
    sublabel: "pendientes de cobro",
    icon: Bell,
    iconBg: "var(--sp-accent-soft)",
    iconColor: "var(--sp-accent)",
    valueColor: "var(--sp-accent)",
    borderColor: "var(--sp-accent)",
    href: "/avisos",
  },
  {
    key: "paidThisMonth" as const,
    label: "Pagados",
    sublabel: "este mes",
    icon: CheckCircle,
    iconBg: "var(--sp-green-soft)",
    iconColor: "var(--sp-green)",
    valueColor: "var(--sp-green)",
    borderColor: "var(--sp-green)",
    href: "/avisos",
  },
  {
    key: "activePolicies" as const,
    label: "Pólizas vigentes",
    sublabel: "activas",
    icon: FileText,
    iconBg: "rgba(139,92,246,0.12)",
    iconColor: "#a78bfa",
    valueColor: "#a78bfa",
    borderColor: "#a78bfa",
    href: "/polizas",
  },
  {
    key: "activeClients" as const,
    label: "Asegurados",
    sublabel: "registrados",
    icon: Users,
    iconBg: "rgba(20,184,166,0.12)",
    iconColor: "#2dd4bf",
    valueColor: "#2dd4bf",
    borderColor: "#2dd4bf",
    href: "/asegurados",
  },
]

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statConfig.map(({ key, label, sublabel, icon: Icon, iconBg, iconColor, valueColor, borderColor, href }) => (
        <Link
          key={key}
          href={href}
          className="rounded-xl p-5 flex items-center justify-between group transition-all"
          style={{
            backgroundColor: "var(--sp-surface)",
            border: `1px solid var(--sp-border)`,
            borderLeft: `3px solid ${borderColor}`,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = borderColor
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sp-border)"
          }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--sp-text-muted)" }}>
              {label}
            </p>
            <p className="text-3xl font-extrabold leading-none" style={{ color: valueColor }}>
              {stats[key] ?? 0}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--sp-text-faint)" }}>
              {sublabel}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </Link>
      ))}
    </div>
  )
}
