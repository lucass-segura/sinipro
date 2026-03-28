"use client"

import React, { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { MessageCircle, Mail, Phone, CheckCircle, Loader2, User } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"
import { logReminder } from "@/app/actions/reminders"
import type { PolicyNotice, ReminderLog } from "@/types"

type Channel = "whatsapp" | "email" | "manual"

interface ReminderDialogProps {
  notice: PolicyNotice
  open: boolean
  onClose: () => void
}

const channelConfig: Record<Channel, {
  icon: React.ElementType
  label: string
  desc: string
  activeStyle: { backgroundColor: string; border: string }
  idleStyle: { backgroundColor: string; border: string }
  iconColor: string
}> = {
  whatsapp: {
    icon: MessageCircle,
    label: "WhatsApp",
    desc: "Abre WhatsApp con mensaje pre-cargado",
    activeStyle: { backgroundColor: "rgba(74,225,118,0.12)", border: "2px solid var(--sp-green)" },
    idleStyle:   { backgroundColor: "var(--sp-surface-low)", border: "2px solid var(--sp-border)" },
    iconColor: "var(--sp-green)",
  },
  email: {
    icon: Mail,
    label: "Email",
    desc: "Abre cliente de correo con mensaje listo",
    activeStyle: { backgroundColor: "var(--sp-accent-soft)", border: "2px solid var(--sp-accent)" },
    idleStyle:   { backgroundColor: "var(--sp-surface-low)", border: "2px solid var(--sp-border)" },
    iconColor: "var(--sp-accent)",
  },
  manual: {
    icon: Phone,
    label: "Contacto manual",
    desc: "Solo registra que se contactó al cliente",
    activeStyle: { backgroundColor: "var(--sp-surface-hover)", border: "2px solid var(--sp-border-strong)" },
    idleStyle:   { backgroundColor: "var(--sp-surface-low)", border: "2px solid var(--sp-border)" },
    iconColor: "var(--sp-text-muted)",
  },
}

function buildWhatsAppUrl(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "")
  const number = cleaned.startsWith("0") ? "549" + cleaned.slice(1) : cleaned.startsWith("54") ? cleaned : "549" + cleaned
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

function buildEmailUrl(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildDefaultMessage(notice: PolicyNotice) {
  const client = notice.policies.clients
  const policy = notice.policies
  const dueDate = format(parseISO(notice.due_date), "d 'de' MMMM 'de' yyyy", { locale: es })
  return `Hola ${client.full_name}, le recordamos que su póliza de ${policy.branch}${
    policy.vehicle_plate ? ` (${policy.vehicle_plate})` : ""
  }${
    policy.policy_number ? ` N° ${policy.policy_number}` : ""
  } vence el ${dueDate}. Por favor, acérquese a renovar. Muchas gracias.`
}

export function ReminderDialog({ notice, open, onClose }: ReminderDialogProps) {
  const [channel, setChannel] = useState<Channel>("whatsapp")
  const [message, setMessage] = useState(() => buildDefaultMessage(notice))
  const [loading, setLoading] = useState(false)

  const client = notice.policies.clients
  const clientNote = client.notes

  const handleSend = async () => {
    setLoading(true)
    try {
      if (channel === "whatsapp" && client.phone) {
        window.open(buildWhatsAppUrl(client.phone, message), "_blank")
      } else if (channel === "email" && client.email) {
        window.open(buildEmailUrl(client.email, "Recordatorio de vencimiento de póliza", message), "_blank")
      }

      const result = await logReminder(notice.id, channel, client.phone, client.email, message.slice(0, 200))

      if (result.error) {
        toast.error("No se pudo registrar el recordatorio")
      } else {
        toast.success("Recordatorio registrado correctamente")
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const reminderLogs = notice.reminder_logs ?? []
  const canSend = !(
    (channel === "whatsapp" && !client.phone) ||
    (channel === "email" && !client.email)
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <div className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--sp-text)" }}>
              Enviar Recordatorio
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
              {notice.policies.branch}
              {notice.policies.vehicle_plate && ` · ${notice.policies.vehicle_plate}`}
              {notice.policies.policy_number && ` · #${notice.policies.policy_number}`}
            </p>
          </div>

          {/* Client info */}
          <div
            className="rounded-lg p-3 space-y-1"
            style={{
              backgroundColor: "var(--sp-surface-low)",
              border: "1px solid var(--sp-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--sp-text)" }}>
                {client.full_name}
              </span>
            </div>
            {client.phone && (
              <p className="text-xs pl-5" style={{ color: "var(--sp-text-muted)" }}>{client.phone}</p>
            )}
            {client.email && (
              <p className="text-xs pl-5" style={{ color: "var(--sp-text-muted)" }}>{client.email}</p>
            )}
            {clientNote && (
              <div
                className="mt-2 pt-2 rounded-lg px-2 py-1.5"
                style={{
                  borderTop: "1px solid var(--sp-border)",
                  backgroundColor: "var(--sp-amber-soft)",
                  border: `1px solid rgba(245,158,11,0.2)`,
                }}
              >
                <p className="text-xs font-medium mb-0.5" style={{ color: "var(--sp-amber)" }}>
                  Nota del asegurado:
                </p>
                <p className="text-xs" style={{ color: "var(--sp-text)" }}>{clientNote}</p>
              </div>
            )}
          </div>

          {/* Channel selection */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(channelConfig) as [Channel, typeof channelConfig.whatsapp][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              const isActive = channel === key
              return (
                <button
                  key={key}
                  onClick={() => setChannel(key)}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all"
                  style={isActive ? cfg.activeStyle : cfg.idleStyle}
                >
                  <Icon className="h-5 w-5" style={{ color: isActive ? cfg.iconColor : "var(--sp-text-muted)" }} />
                  <span className="text-xs font-semibold leading-tight" style={{ color: isActive ? "var(--sp-text)" : "var(--sp-text-muted)" }}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] leading-tight" style={{ color: "var(--sp-text-faint)" }}>
                    {cfg.desc}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Message preview */}
          {channel !== "manual" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
                Mensaje
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-all"
                style={{
                  backgroundColor: "var(--sp-surface-low)",
                  border: "1px solid var(--sp-border-strong)",
                  color: "var(--sp-text)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
              />
              <p className="text-right text-[10px]" style={{ color: "var(--sp-text-faint)" }}>
                {message.length} caracteres
              </p>
            </div>
          )}

          {/* Reminder history */}
          {reminderLogs.length > 0 && (
            <div className="space-y-2 pt-3" style={{ borderTop: "1px solid var(--sp-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
                Historial de recordatorios
              </p>
              <ul className="space-y-2">
                {reminderLogs.map((log: ReminderLog) => (
                  <li key={log.id} className="flex items-start gap-2 text-xs">
                    <div className="mt-0.5">
                      {log.channel === "whatsapp" ? (
                        <MessageCircle className="h-3.5 w-3.5" style={{ color: "var(--sp-green)" }} />
                      ) : log.channel === "email" ? (
                        <Mail className="h-3.5 w-3.5" style={{ color: "var(--sp-accent)" }} />
                      ) : (
                        <Phone className="h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span style={{ color: "var(--sp-text-muted)" }}>
                        {log.user_profiles?.display_name ?? "Usuario"}
                      </span>
                      {" · "}
                      <span style={{ color: "var(--sp-text)" }}>
                        {format(parseISO(log.sent_at), "d MMM yyyy HH:mm", { locale: es })}
                      </span>
                      {log.message_preview && (
                        <p className="truncate mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                          {log.message_preview}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing contact warning */}
          {!canSend && (
            <p className="text-xs text-center" style={{ color: "var(--sp-red)" }}>
              El asegurado no tiene {channel === "whatsapp" ? "teléfono" : "email"} registrado.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !canSend}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {channel === "manual" ? "Registrar contacto" : "Enviar y registrar"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
