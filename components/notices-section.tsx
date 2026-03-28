"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  User,
  MapPin,
  MessageSquare,
  Save,
  Trash2,
  X,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react"
import { PaymentDialog } from "@/components/payment-dialog"
import { FiltersPanel } from "@/components/avisos/filters-panel"
import {
  updateNoticeStatus,
  getCurrentUser,
  getNoticesFiltered,
  upsertNoticeNote,
  deleteNoticeNote,
} from "@/app/actions/notices"

import type { Note, NoticeFilters, PolicyNotice } from "@/types/index"

interface NoticesSectionProps {
  notices: PolicyNotice[]
  companies: { id: string; name: string }[]
}

// ─── Note component ──────────────────────────────────────────────────────────

function NoticeNote({ noticeId, notes, currentUserId, onNoteUpdate }: { noticeId: string; notes: Note[]; currentUserId: string; onNoteUpdate: (noticeId: string, notes: Note[]) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const userNote = useMemo(() => (notes || []).find((n) => n.user_id === currentUserId), [notes, currentUserId])

  useEffect(() => {
    setNoteText(userNote?.note || "")
  }, [userNote])

  const handleSave = async () => {
    if (!noteText.trim()) return
    setIsLoading(true)
    const result = await upsertNoticeNote(noticeId, noteText.trim())
    if (result.data) {
      const updatedNotes = userNote
        ? notes.map((n) => (n.id === userNote.id ? result.data! : n))
        : [...notes, result.data]
      onNoteUpdate(noticeId, updatedNotes)
      setIsEditing(false)
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (userNote && window.confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      setIsLoading(true)
      const result = await deleteNoticeNote(userNote.id)
      if (result.data) {
        const updatedNotes = notes.filter((n) => n.id !== userNote.id)
        onNoteUpdate(noticeId, updatedNotes)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="pt-2 border-t mt-2 space-y-1.5">
      <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
        <MessageSquare className="h-3 w-3" />
        Notas
      </h4>
      {isEditing ? (
        <div className="space-y-1.5">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="text-xs min-h-[48px]"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex gap-1.5 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isLoading} className="h-6 w-6 p-0" style={{ cursor: "pointer" }}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading} className="h-6 w-6 p-0" style={{ cursor: "pointer" }}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ) : userNote ? (
        <div
          className="group flex items-start gap-1.5 px-2 py-1.5 rounded-md text-[10px]"
          style={{ backgroundColor: "var(--sp-amber-soft)", borderLeft: "2px solid var(--sp-amber)" }}
        >
          <div className="flex-1 min-w-0">
            <span className="font-semibold" style={{ color: "var(--sp-amber)" }}>{userNote.user_profiles?.display_name || "Tú"}:</span>{" "}
            <span className="italic" style={{ color: "var(--sp-amber)" }}>{userNote.note}</span>
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ cursor: "pointer", background: "none", border: "none", padding: 0, color: "var(--sp-red)" }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full text-[10px] py-1.5 rounded-md transition-colors"
          style={{
            cursor: "pointer",
            color: "var(--sp-text-faint)",
            backgroundColor: "var(--sp-surface-low)",
            border: "1px solid var(--sp-border)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--sp-border-strong)" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--sp-border)" }}
        >
          + Agregar nota
        </button>
      )}
      {/* Other users' notes */}
      {(notes || []).filter(n => n.user_id !== currentUserId).map(note => (
        <div
          key={note.id}
          className="flex items-start gap-1.5 px-2 py-1.5 rounded-md text-[10px]"
          style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}
        >
          <span className="font-semibold" style={{ color: "var(--sp-text-muted)" }}>{note.user_profiles?.display_name || "Otro"}:</span>{" "}
          <span style={{ color: "var(--sp-text-muted)" }}>{note.note}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntilDue(dueDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + "T00:00:00"); due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function dueLabel(days: number) {
  if (days < 0) return `Vencido hace ${Math.abs(days)}d`
  if (days === 0) return "Vence hoy"
  if (days === 1) return "Mañana"
  return `En ${days} días`
}

function dueColor(days: number) {
  if (days < 0)  return "var(--sp-red)"
  if (days <= 7) return "var(--sp-amber)"
  return "var(--sp-text-muted)"
}

// ─── Notice Card ──────────────────────────────────────────────────────────────

function NoticeCard({
  notice,
  currentUser,
  onStatusChange,
  onNoteUpdate,
}: {
  notice: PolicyNotice
  currentUser: { id: string; email: string } | null
  onStatusChange: (id: string, status: "avisar" | "avisado" | "pagado") => void
  onNoteUpdate: (noticeId: string, notes: Note[]) => void
}) {
  const days = getDaysUntilDue(notice.due_date)
  const client = notice.policies.clients
  const branch = notice.policies.branch
  const due = dueColor(days)

  const initials = client.full_name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <article
      className="rounded-lg transition-all"
      style={{
        backgroundColor: "var(--sp-surface)",
        border: "1px solid var(--sp-border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--sp-border-strong)"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--sp-border)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div className="p-3">
        {/* Row 1: Client name + avatar */}
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-[13px] font-semibold leading-tight truncate" style={{ color: "var(--sp-text)" }}>
            {client.full_name}
          </h4>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2"
            style={{
              backgroundColor: "var(--sp-surface-lowest)",
              border: "1px solid var(--sp-border)",
            }}
          >
            <span className="text-[8px] font-bold" style={{ color: "var(--sp-text-muted)" }}>
              {initials}
            </span>
          </div>
        </div>

        {/* Row 2: Summary line */}
        <p className="text-[11px] line-clamp-1 mb-1.5" style={{ color: "var(--sp-text-muted)" }}>
          {notice.policies.companies.name}
          {notice.policies.policy_number ? ` · #${notice.policies.policy_number}` : ""}
          {notice.policies.vehicle_plate ? ` · ${notice.policies.vehicle_plate}` : ""}
        </p>

        {/* Row 3: Branch + due + locality */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }}
            >
              {branch}
            </span>
            {client.locality && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--sp-text-faint)" }}>
                <MapPin className="h-2.5 w-2.5" />
                {client.locality}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold" style={{ color: due }}>
            {dueLabel(days)}
          </span>
        </div>

        {/* Notified by */}
        {notice.notified_by && (notice.status === "avisado" || notice.status === "pagado") && (
          <div className="flex items-center gap-1 mb-2 text-[10px]" style={{ color: "var(--sp-text-faint)" }}>
            <User className="h-3 w-3" />
            <span>Avisado por {notice.notified_by}</span>
          </div>
        )}

        {/* Notes */}
        {currentUser && (
          <NoticeNote
            noticeId={notice.id}
            notes={notice.notice_notes || []}
            currentUserId={currentUser.id}
            onNoteUpdate={onNoteUpdate}
          />
        )}

        {/* Footer: action buttons */}
        <div className="flex gap-1.5 pt-2 mt-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
          {notice.status === "avisar" && (
            <button
              onClick={() => onStatusChange(notice.id, "avisado")}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors"
              style={{ cursor: "pointer", color: "var(--sp-accent)", backgroundColor: "rgba(77,142,255,0.08)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(77,142,255,0.18)" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(77,142,255,0.08)" }}
            >
              <CheckCircle className="h-3 w-3" />
              Avisado
            </button>
          )}
          {notice.status === "avisado" && (
            <>
              <button
                onClick={() => onStatusChange(notice.id, "avisar")}
                className="flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 px-2.5 rounded-md transition-colors"
                style={{ cursor: "pointer", color: "var(--sp-text-faint)", backgroundColor: "rgba(180,180,200,0.06)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.14)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.06)" }}
              >
                <ArrowLeft className="h-3 w-3" />
                Avisar
              </button>
              <button
                onClick={() => onStatusChange(notice.id, "pagado")}
                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors"
                style={{ cursor: "pointer", color: "var(--sp-green)", backgroundColor: "rgba(74,225,118,0.08)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(74,225,118,0.18)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(74,225,118,0.08)" }}
              >
                <CheckCircle className="h-3 w-3" />
                Pagado
              </button>
            </>
          )}
          {notice.status === "pagado" && (
            <button
              onClick={() => onStatusChange(notice.id, "avisado")}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md transition-colors"
              style={{ cursor: "pointer", color: "var(--sp-text-faint)", backgroundColor: "rgba(180,180,200,0.06)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.14)" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.06)" }}
            >
              <ArrowLeft className="h-3 w-3" />
              Avisado
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Column config ───────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "avisar" as const, label: "Avisar", dot: "#f59e0b", icon: AlertTriangle },
  { key: "avisado" as const, label: "Avisados", dot: "#4d8eff", icon: Clock },
  { key: "pagado" as const, label: "Pagados", dot: "#4ae176", icon: CheckCircle },
]

// ─── Main Section ─────────────────────────────────────────────────────────────

export function NoticesSection({ notices: initialNotices, companies }: NoticesSectionProps) {
  const [notices, setNotices] = useState<PolicyNotice[]>(initialNotices)
  const [filters, setFilters] = useState<NoticeFilters>({})
  const [view, setView] = useState<"kanban" | "list">(() => {
    if (typeof window === "undefined") return "kanban"
    return (localStorage.getItem("sp-notices-view") as "kanban" | "list") ?? "kanban"
  })
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<PolicyNotice | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  const handleSetView = (v: "kanban" | "list") => {
    setView(v)
    if (typeof window !== "undefined") localStorage.setItem("sp-notices-view", v)
  }

  useEffect(() => {
    getCurrentUser().then((r) => {
      if (r.data) setCurrentUser({ id: r.data.id, email: r.data.email || "" })
    })
  }, [])

  // Polling every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getNoticesFiltered(filters)
      if (result?.data) setNotices(result.data)
    }, 30000)
    return () => clearInterval(interval)
  }, [filters])

  const handleFiltersChange = useCallback(async (newFilters: NoticeFilters) => {
    setFilters(newFilters)
    const result = await getNoticesFiltered(newFilters)
    if (result?.data) setNotices(result.data)
  }, [])

  const grouped = useMemo(() => ({
    avisar: notices.filter((n) => n.status === "avisar"),
    avisado: notices.filter((n) => n.status === "avisado"),
    pagado: notices.filter((n) => n.status === "pagado"),
  }), [notices])

  const handleStatusChange = async (noticeId: string, newStatus: "avisar" | "avisado" | "pagado") => {
    if (newStatus === "pagado") {
      const notice = notices.find((n) => n.id === noticeId)
      if (notice) {
        setSelectedNotice(notice)
        setPaymentDialogOpen(true)
      }
      return
    }

    try {
      const result = await updateNoticeStatus(noticeId, newStatus)
      if (result.data) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === noticeId
              ? {
                  ...n,
                  status: newStatus,
                  notified_by:
                    newStatus === "avisado" && currentUser
                      ? currentUser.email.split("@")[0]
                      : newStatus === "avisar"
                        ? null
                        : n.notified_by,
                }
              : n,
          ),
        )
      }
    } catch (error) {
      console.error("Error updating notice status:", error)
    }
  }

  const handlePaymentComplete = (updatedNotice: PolicyNotice) => {
    setNotices((prev) => prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n)))
    setPaymentDialogOpen(false)
    setSelectedNotice(null)
  }

  const handleNoteUpdate = (noticeId: string, updatedNotes: Note[]) => {
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId ? { ...n, notice_notes: updatedNotes } : n
      )
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div
        className="shrink-0 px-6 py-4"
        style={{ backgroundColor: "var(--sp-surface-lowest)", borderBottom: "1px solid var(--sp-border)" }}
      >
        <FiltersPanel companies={companies} filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Toolbar: total + view toggle */}
      <div className="flex items-center justify-between px-6 py-2.5 shrink-0">
        <span className="text-xs font-medium" style={{ color: "var(--sp-text-faint)" }}>
          {notices.length} avisos
        </span>

        <div
          className="flex p-0.5 rounded-lg"
          style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}
        >
          <button
            onClick={() => handleSetView("kanban")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
            style={{
              cursor: "pointer",
              ...(view === "kanban"
                ? { backgroundColor: "var(--sp-accent)", color: "#fff" }
                : { color: "var(--sp-text-muted)" }),
            }}
          >
            <LayoutGrid className="h-3 w-3" />
            Kanban
          </button>
          <button
            onClick={() => handleSetView("list")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
            style={{
              cursor: "pointer",
              ...(view === "list"
                ? { backgroundColor: "var(--sp-accent)", color: "#fff" }
                : { color: "var(--sp-text-muted)" }),
            }}
          >
            <List className="h-3 w-3" />
            Lista
          </button>
        </div>
      </div>

      {/* Board / List */}
      <div className="flex-1 min-h-0 px-5 pb-4">
        {view === "kanban" && (
          <div className="grid gap-4 grid-cols-3 h-full">
            {COLUMNS.map(({ key, label, dot }) => (
              <div
                key={key}
                className="flex flex-col min-h-0 rounded-xl"
                style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 shrink-0"
                  style={{ borderBottom: "1px solid var(--sp-border)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                    <h3 className="text-xs font-semibold" style={{ color: "var(--sp-text)" }}>
                      {label}
                    </h3>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: "var(--sp-text-muted)", backgroundColor: "var(--sp-surface-hover)" }}
                  >
                    {grouped[key].length}
                  </span>
                </div>

                {/* Scrollable card area */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {grouped[key].length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs" style={{ color: "var(--sp-text-faint)" }}>Sin avisos</p>
                    </div>
                  ) : (
                    grouped[key].map((n) => (
                      <NoticeCard
                        key={n.id}
                        notice={n}
                        currentUser={currentUser}
                        onStatusChange={handleStatusChange}
                        onNoteUpdate={handleNoteUpdate}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "list" && (
          notices.length === 0 ? (
            <div
              className="rounded-lg py-16 flex items-center justify-center"
              style={{ border: "1px dashed var(--sp-border-strong)" }}
            >
              <p className="text-sm" style={{ color: "var(--sp-text-faint)" }}>
                No hay avisos que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-y-auto h-full"
              style={{ border: "1px solid var(--sp-border)" }}
            >
              {notices.map((n, idx) => {
                const days = getDaysUntilDue(n.due_date)
                const client = n.policies.clients
                const due = dueColor(days)
                return (
                  <div
                    key={n.id}
                    className="flex items-center gap-4 px-5 py-3 transition-all"
                    style={{
                      cursor: "pointer",
                      backgroundColor: "var(--sp-surface)",
                      borderBottom: idx < notices.length - 1 ? "1px solid var(--sp-border)" : undefined,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface)")}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLUMNS.find(c => c.key === n.status)?.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm" style={{ color: "var(--sp-text)" }}>
                        {client.full_name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
                        <span>{n.policies.companies.name}</span>
                        {n.policies.policy_number && <span>· #{n.policies.policy_number}</span>}
                        {n.policies.vehicle_plate && <span className="font-mono uppercase">· {n.policies.vehicle_plate}</span>}
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }}
                    >
                      {n.policies.branch}
                    </span>
                    <span className="text-xs font-semibold shrink-0" style={{ color: due }}>
                      {dueLabel(days)}
                    </span>
                    <div className="shrink-0">
                      {n.status === "avisar" && (
                        <button
                          onClick={() => handleStatusChange(n.id, "avisado")}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                          style={{ cursor: "pointer", color: "var(--sp-accent)", backgroundColor: "rgba(77,142,255,0.08)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(77,142,255,0.18)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(77,142,255,0.08)" }}
                        >
                          Avisar
                        </button>
                      )}
                      {n.status === "avisado" && (
                        <button
                          onClick={() => handleStatusChange(n.id, "pagado")}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                          style={{ cursor: "pointer", color: "var(--sp-green)", backgroundColor: "rgba(74,225,118,0.08)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(74,225,118,0.18)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(74,225,118,0.08)" }}
                        >
                          Pago
                        </button>
                      )}
                      {n.status === "pagado" && (
                        <button
                          onClick={() => handleStatusChange(n.id, "avisado")}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                          style={{ cursor: "pointer", color: "var(--sp-text-faint)", backgroundColor: "rgba(180,180,200,0.06)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.14)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(180,180,200,0.06)" }}
                        >
                          Revertir
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        notice={selectedNotice}
        onSuccess={handlePaymentComplete}
      />
    </div>
  )
}
