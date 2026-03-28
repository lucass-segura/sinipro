"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle, Bell, DollarSign } from "lucide-react"

const activityConfig = {
  pagado: {
    label: "Pago registrado",
    icon: DollarSign,
    iconBg: "var(--sp-green-soft)",
    iconColor: "var(--sp-green)",
    dot: "var(--sp-green)",
  },
  avisado: {
    label: "Recordatorio enviado",
    icon: Bell,
    iconBg: "var(--sp-accent-soft)",
    iconColor: "var(--sp-accent)",
    dot: "var(--sp-accent)",
  },
  avisar: {
    label: "Pendiente de aviso",
    icon: CheckCircle,
    iconBg: "var(--sp-amber-soft)",
    iconColor: "var(--sp-amber)",
    dot: "var(--sp-amber)",
  },
}

interface ActivityItem {
  id: string
  status: "avisar" | "avisado" | "pagado"
  notified_by?: string | null
  updated_at?: string
  policies: {
    branch: string
    clients: { full_name: string }
  } | null
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--sp-border)" }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--sp-text)" }}>
          Actividad Reciente
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: "var(--sp-text-faint)" }}>
          Sin actividad reciente
        </p>
      ) : (
        <ul className="relative">
          {/* Timeline vertical line */}
          <div
            className="absolute left-[32px] top-4 bottom-4 w-px"
            style={{ backgroundColor: "var(--sp-border)" }}
          />
          {items.map((item, idx) => {
            const config = activityConfig[item.status]
            const Icon = config.icon
            return (
              <li
                key={item.id}
                className="flex items-start gap-4 px-5 py-3 relative"
                style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--sp-border)" : undefined }}
              >
                {/* Icon bubble */}
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 z-10"
                  style={{ backgroundColor: config.iconBg }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: config.iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--sp-text)" }}>
                    <span className="font-medium">{item.policies?.clients?.full_name}</span>
                    <span style={{ color: "var(--sp-text-muted)" }}> — {item.policies?.branch}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                    {config.label}
                    {item.notified_by && (
                      <span style={{ color: "var(--sp-accent)" }}> · {item.notified_by}</span>
                    )}
                  </p>
                </div>

                {item.updated_at && (
                  <span className="text-[11px] shrink-0" style={{ color: "var(--sp-text-faint)" }}>
                    {format(parseISO(item.updated_at), "d MMM HH:mm", { locale: es })}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
