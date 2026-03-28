"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronRight, Phone, Mail, MapPin, IdCard, Home, StickyNote,
  Car, Bike, Shield, Store, Heart, UserCheck, MoreHorizontal,
  Hash, Pencil, X, Clock, Check, AlertTriangle, Calendar,
  Building2, FileText, ToggleLeft, ToggleRight, Loader2,
  MessageSquare, Send,
} from "lucide-react"
import { ClientDialog } from "@/components/client-dialog"
import { updatePolicy, getPolicyHistory } from "@/app/actions/policies"
import { updateClient } from "@/app/actions/clients"
import { addNoteToNotice, deleteNoteFromNotice } from "@/app/actions/notices"
import { LocalityCombobox } from "@/components/locality-combobox"
import { DateWheelPicker } from "@/components/ui/date-wheel-picker"
import { POLICY_BRANCHES, VEHICLE_BRANCHES } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: string; name: string }

interface Policy {
  id: string
  client_id: string
  company_id: string
  branch: string
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
  is_active: boolean
  created_at?: string
  companies?: Company
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
  created_at?: string
  policies: Policy[]
}

interface SimpleNote {
  id: string
  note: string
  created_at?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user_profiles: any
}

interface NoticeRecord {
  id: string
  due_date: string
  status: "avisar" | "avisado" | "pagado"
  paid_installments: number
  notified_by?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notice_notes?: any[]
}

interface PolicyFormData {
  branch: string
  company_id: string
  policy_number: string
  vehicle_plate: string
  first_payment_date: string
  is_active: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRANCH_ICONS: Record<string, React.ElementType> = {
  Automotores: Car,
  Motovehiculos: Bike,
  "Responsabilidad civil": Shield,
  Hogar: Home,
  Comercio: Store,
  Vida: Heart,
  "Accidentes Personales": UserCheck,
  Otro: MoreHorizontal,
}

const STATUS_CONFIG = {
  avisar:  { label: "Avisar",  dot: "#f59e0b", bg: "rgba(245,158,11,0.1)",  text: "#f59e0b",  border: "rgba(245,158,11,0.25)"  },
  avisado: { label: "Avisado", dot: "#4d8eff", bg: "rgba(77,142,255,0.1)",  text: "#adc6ff", border: "rgba(77,142,255,0.25)"  },
  pagado:  { label: "Pagado",  dot: "#4ae176", bg: "rgba(74,225,118,0.1)", text: "#4ae176", border: "rgba(74,225,118,0.25)" },
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function toFormData(policy: Policy): PolicyFormData {
  return {
    branch: policy.branch,
    company_id: policy.company_id,
    policy_number: policy.policy_number ?? "",
    vehicle_plate: policy.vehicle_plate ?? "",
    first_payment_date: policy.first_payment_date,
    is_active: policy.is_active,
  }
}

// ─── Unsaved Changes Modal ────────────────────────────────────────────────────

function UnsavedModal({
  onKeepEditing,
  onDiscard,
  onSave,
  saving,
}: {
  onKeepEditing: () => void
  onDiscard: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--sp-amber-soft)" }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--sp-amber)" }} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--sp-text)" }}>
              ¿Salir sin guardar?
            </h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
              Tenés cambios sin guardar. ¿Qué querés hacer?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42", cursor: "pointer" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Guardar cambios
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              cursor: "pointer",
              background: "rgba(255,100,100,0.1)",
              border: "1px solid rgba(255,100,100,0.25)",
              color: "var(--sp-red)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,100,100,0.18)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,100,100,0.1)" }}
          >
            Salir sin guardar
          </button>
          <button
            onClick={onKeepEditing}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              cursor: "pointer",
              color: "var(--sp-text-muted)",
              border: "1px solid var(--sp-border)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface-low)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Policy Edit Form ─────────────────────────────────────────────────────────

function PolicyEditForm({
  form,
  onChange,
  companies,
}: {
  form: PolicyFormData
  onChange: (f: PolicyFormData) => void
  companies: Company[]
}) {
  const isVehicle = (VEHICLE_BRANCHES as string[]).includes(form.branch)

  const field = (label: string, el: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
        {label}
      </label>
      {el}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid var(--sp-border-strong)",
    backgroundColor: "var(--sp-surface-low)",
    color: "var(--sp-text)",
    fontSize: 13,
    outline: "none",
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
  }

  return (
    <div className="space-y-4">
      {field("Ramo",
        <select
          value={form.branch}
          onChange={(e) => onChange({ ...form, branch: e.target.value, vehicle_plate: "" })}
          style={selectStyle}
        >
          {POLICY_BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}

      {field("Compañía",
        <select
          value={form.company_id}
          onChange={(e) => onChange({ ...form, company_id: e.target.value })}
          style={selectStyle}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {field("Número de póliza",
        <input
          type="text"
          value={form.policy_number}
          onChange={(e) => onChange({ ...form, policy_number: e.target.value })}
          placeholder="Opcional"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
        />
      )}

      {isVehicle && field("Patente",
        <input
          type="text"
          value={form.vehicle_plate}
          onChange={(e) => onChange({ ...form, vehicle_plate: e.target.value.toUpperCase() })}
          placeholder="Ej: ABC123"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
        />
      )}

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
          Fecha de primer pago
        </label>
        <DateWheelPicker
          value={form.first_payment_date}
          onChange={(v) => onChange({ ...form, first_payment_date: v })}
          placeholder="Seleccionar fecha"
        />
      </div>

      <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--sp-text)" }}>Estado</p>
          <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>{form.is_active ? "Póliza activa" : "Póliza inactiva"}</p>
        </div>
        <button
          onClick={() => onChange({ ...form, is_active: !form.is_active })}
          style={{ cursor: "pointer", color: form.is_active ? "var(--sp-green)" : "var(--sp-text-muted)", background: "none", border: "none", padding: 0 }}
        >
          {form.is_active
            ? <ToggleRight className="h-8 w-8" />
            : <ToggleLeft className="h-8 w-8" />
          }
        </button>
      </div>
    </div>
  )
}

// ─── Notice History Row (with notes) ─────────────────────────────────────────

function NoticeHistoryRow({
  notice: n,
  idx,
  total,
  statusConfig: st,
}: {
  notice: NoticeRecord
  idx: number
  total: number
  statusConfig: { label: string; bg: string; text: string; border: string; dot: string }
}) {
  const [expanded, setExpanded] = useState(false)
  const [localNotes, setLocalNotes] = useState<SimpleNote[]>((n.notice_notes as SimpleNote[]) ?? [])
  const [noteText, setNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    const res = await addNoteToNotice(n.id, noteText.trim())
    if (!res.error && res.data) {
      setLocalNotes((prev) => [...prev, res.data as unknown as SimpleNote])
      setNoteText("")
    }
    setAddingNote(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    setLocalNotes((prev) => prev.filter((nn) => nn.id !== noteId))
    await deleteNoteFromNotice(noteId)
  }

  return (
    <div
      style={{
        backgroundColor: "var(--sp-surface)",
        borderBottom: idx < total - 1 ? "1px solid var(--sp-border)" : undefined,
        opacity: n.deleted_at ? 0.55 : 1,
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--sp-text)" }}>
            {format(parseISO(n.due_date), "d 'de' MMMM yyyy", { locale: es })}
          </p>
          {n.notified_by && (
            <p className="text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
              Avisado por {n.notified_by}
            </p>
          )}
          {!expanded && localNotes.length > 0 && (
            <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--sp-text-faint)" }}>
              <MessageSquare className="h-3 w-3" />
              {localNotes.length} nota{localNotes.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}
          >
            {st.label}
          </span>
          {n.deleted_at && (
            <span className="text-[9px]" style={{ color: "var(--sp-text-faint)" }}>archivado</span>
          )}
        </div>
      </div>

      {/* Expanded notes area */}
      {expanded && (
        <div
          className="px-4 pb-3 space-y-2"
          style={{ borderTop: "1px solid var(--sp-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2 space-y-1.5">
            {localNotes.length === 0 && (
              <p className="text-xs italic" style={{ color: "var(--sp-text-faint)" }}>Sin notas</p>
            )}
            {localNotes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: "var(--sp-text)" }}>{note.note}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--sp-text-faint)" }}>
                    {Array.isArray(note.user_profiles) ? note.user_profiles[0]?.display_name : (note.user_profiles as any)?.display_name ?? "Usuario"}
                    {note.created_at ? ` · ${format(parseISO(note.created_at), "d MMM HH:mm", { locale: es })}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="shrink-0 mt-0.5 transition-colors"
                  style={{ cursor: "pointer", background: "none", border: "none", padding: 2, color: "var(--sp-text-faint)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-red)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-faint)" }}
                  title="Eliminar nota"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Agregar nota..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !addingNote) handleAddNote() }}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none"
              style={{
                backgroundColor: "var(--sp-surface-low)",
                border: "1px solid var(--sp-border-strong)",
                color: "var(--sp-text)",
              }}
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={!noteText.trim() || addingNote}
              className="px-2.5 py-1.5 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor: noteText.trim() ? "var(--sp-accent)" : "var(--sp-surface-low)",
                color: noteText.trim() ? "#fff" : "var(--sp-text-faint)",
                border: "none",
                cursor: noteText.trim() && !addingNote ? "pointer" : "not-allowed",
              }}
            >
              {addingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Policy Accordion Panel (inline) ─────────────────────────────────────────

function PolicyAccordionPanel({
  policy,
  companies,
  onClose,
  onUpdate,
}: {
  policy: Policy
  companies: Company[]
  onClose: () => void
  onUpdate: (updated: Policy) => void
}) {
  const [history, setHistory] = useState<NoticeRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PolicyFormData>(toFormData(policy))
  const [originalForm, setOriginalForm] = useState<PolicyFormData>(toFormData(policy))
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  useEffect(() => {
    setLoadingHistory(true)
    getPolicyHistory(policy.id).then((r) => {
      setHistory(r.data ?? [])
      setLoadingHistory(false)
    })
  }, [policy.id])

  const handleCloseAttempt = () => {
    if (isEditing && isDirty) {
      setShowUnsaved(true)
    } else {
      onClose()
    }
  }

  const handleCancelEdit = () => {
    if (isDirty) {
      setShowUnsaved(true)
    } else {
      setForm(originalForm)
      setIsEditing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    const result = await updatePolicy(policy.id, form)
    if (result.error) {
      setSaveError(result.error)
      setSaving(false)
      return
    }
    const updatedPolicy: Policy = {
      ...policy,
      branch: form.branch,
      company_id: form.company_id,
      policy_number: form.policy_number || undefined,
      vehicle_plate: form.vehicle_plate || undefined,
      first_payment_date: form.first_payment_date,
      is_active: form.is_active,
      companies: companies.find((c) => c.id === form.company_id) ?? policy.companies,
    }
    onUpdate(updatedPolicy)
    setOriginalForm(form)
    setIsEditing(false)
    setShowUnsaved(false)
    setSaving(false)
  }

  const handleDiscard = () => {
    setForm(originalForm)
    setIsEditing(false)
    setShowUnsaved(false)
    onClose()
  }

  const BranchIcon = BRANCH_ICONS[policy.branch] ?? Shield
  const noticeHistory = history
  const paymentHistory = history.filter((n) => n.paid_installments > 0 || n.status === "pagado")

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--sp-surface)",
        border: "1px solid var(--sp-border)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--sp-border)", backgroundColor: "var(--sp-surface-low)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--sp-accent-soft)" }}
        >
          <BranchIcon className="h-4 w-4" style={{ color: "var(--sp-accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm" style={{ color: "var(--sp-text)" }}>{policy.branch}</h2>
          <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>{policy.companies?.name ?? "—"}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                cursor: "pointer",
                background: "rgba(77,142,255,0.12)",
                border: "1px solid rgba(77,142,255,0.28)",
                color: "var(--sp-accent)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(77,142,255,0.22)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(77,142,255,0.12)" }}
            >
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  cursor: "pointer",
                  color: "var(--sp-text-muted)",
                  border: "1px solid var(--sp-border)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  cursor: saving || !isDirty ? "default" : "pointer",
                  background: isDirty ? "linear-gradient(135deg, #adc6ff, #4d8eff)" : "var(--sp-surface)",
                  color: isDirty ? "#001a42" : "var(--sp-text-faint)",
                  border: "none",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Guardar
              </button>
            </>
          )}

          <button
            onClick={handleCloseAttempt}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ cursor: "pointer", color: "var(--sp-text-faint)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-text)"; e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-faint)"; e.currentTarget.style.backgroundColor = "transparent" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">

        {/* Edit error */}
        {saveError && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "var(--sp-red-soft)", color: "var(--sp-red)", border: "1px solid rgba(255,100,100,0.2)" }}>
            {saveError}
          </div>
        )}

        {/* Policy info or edit form */}
        {isEditing ? (
          <PolicyEditForm form={form} onChange={setForm} companies={companies} />
        ) : (
          <PolicyInfo policy={policy} />
        )}

        {/* Notice history */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sp-text-muted)" }}>
            Historial de avisos
          </h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--sp-text-faint)" }} />
            </div>
          ) : noticeHistory.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "var(--sp-text-faint)" }}>Sin registros</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
              {noticeHistory.map((n, idx) => {
                const st = STATUS_CONFIG[n.status]
                return (
                  <NoticeHistoryRow
                    key={n.id}
                    notice={n}
                    idx={idx}
                    total={noticeHistory.length}
                    statusConfig={st}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Payment history */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sp-text-muted)" }}>
            Historial de pagos
          </h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--sp-text-faint)" }} />
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "var(--sp-text-faint)" }}>Sin pagos registrados</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
              {paymentHistory.map((n, idx) => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: "var(--sp-surface)",
                    borderBottom: idx < paymentHistory.length - 1 ? "1px solid var(--sp-border)" : undefined,
                  }}
                >
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--sp-green)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--sp-text)" }}>
                      {format(parseISO(n.due_date), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                    {n.paid_installments > 1 && (
                      <p className="text-[11px]" style={{ color: "var(--sp-text-muted)" }}>
                        {n.paid_installments} cuotas abonadas
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: "rgba(74,225,118,0.1)", color: "var(--sp-green)", border: "1px solid rgba(74,225,118,0.25)" }}
                  >
                    Pagado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Unsaved changes modal */}
      {showUnsaved && (
        <UnsavedModal
          onKeepEditing={() => setShowUnsaved(false)}
          onDiscard={handleDiscard}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}

// ─── Policy Info (read-only) ──────────────────────────────────────────────────

function PolicyInfo({ policy }: { policy: Policy }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)" }}
    >
      <div className="grid grid-cols-2 gap-3">
        <InfoRow icon={Building2} label="Compañía" value={policy.companies?.name ?? "—"} />
        {policy.policy_number && (
          <InfoRow icon={Hash} label="N° póliza" value={`#${policy.policy_number}`} />
        )}
        {policy.vehicle_plate && (
          <InfoRow icon={Car} label="Patente" value={policy.vehicle_plate} mono />
        )}
        <InfoRow icon={Calendar} label="Primer pago" value={
          format(parseISO(policy.first_payment_date), "MMM yyyy", { locale: es })
        } />
      </div>
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={
            policy.is_active
              ? { backgroundColor: "rgba(74,225,118,0.1)", color: "var(--sp-green)", border: "1px solid rgba(74,225,118,0.25)" }
              : { backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }
          }
        >
          {policy.is_active ? "Activa" : "Inactiva"}
        </span>
        {policy.created_at && (
          <span className="text-[11px]" style={{ color: "var(--sp-text-faint)" }}>
            Creada {format(parseISO(policy.created_at), "d MMM yyyy", { locale: es })}
          </span>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--sp-text-muted)" }} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>{label}</p>
        <p className={`text-xs font-semibold truncate ${mono ? "font-mono uppercase" : ""}`} style={{ color: "var(--sp-text)" }}>{value}</p>
      </div>
    </div>
  )
}

// ─── Client Edit Form (inline) ────────────────────────────────────────────────

interface ClientFormData {
  full_name: string
  phone: string
  email: string
  locality: string
  dni: string
  address: string
  birth_date: string
  notes: string
}

function ClientEditForm({
  client,
  companies,
  onSave,
  onCancel,
}: {
  client: Client
  companies: Company[]
  onSave: (updated: Client) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ClientFormData>({
    full_name: client.full_name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    locality: client.locality ?? "",
    dni: client.dni ?? "",
    address: client.address ?? "",
    birth_date: client.birth_date ?? "",
    notes: client.notes ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid var(--sp-border-strong)",
    backgroundColor: "var(--sp-surface-low)",
    color: "var(--sp-text)",
    fontSize: 13,
    outline: "none",
  }

  const field = (label: string, el: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
        {label}
      </label>
      {el}
    </div>
  )

  const handleSave = async () => {
    if (!form.full_name.trim()) { setSaveError("El nombre es requerido"); return }
    setSaving(true)
    setSaveError("")
    const existingPolicies = (client.policies ?? []).map((p) => ({
      id: p.id,
      branch: p.branch,
      vehicle_plate: p.vehicle_plate,
      policy_number: p.policy_number,
      first_payment_date: p.first_payment_date,
      company_id: p.company_id,
    }))
    const result = await updateClient(client.id, {
      full_name: form.full_name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      locality: form.locality || undefined,
      dni: form.dni || undefined,
      address: form.address || undefined,
      birth_date: form.birth_date || undefined,
      notes: form.notes || undefined,
    }, existingPolicies)
    if (result.error) {
      setSaveError(result.error)
      setSaving(false)
      return
    }
    onSave({ ...client, ...form, phone: form.phone || undefined, email: form.email || undefined, locality: form.locality || undefined, dni: form.dni || undefined, address: form.address || undefined, birth_date: form.birth_date || undefined, notes: form.notes || undefined })
    setSaving(false)
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "var(--sp-surface)",
        border: "1px solid var(--sp-accent)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold" style={{ color: "var(--sp-text)" }}>Editar asegurado</h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ cursor: "pointer", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface-low)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              cursor: saving ? "default" : "pointer",
              background: "linear-gradient(135deg, #adc6ff, #4d8eff)",
              color: "#001a42",
              border: "none",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Guardar
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: "var(--sp-red-soft)", color: "var(--sp-red)", border: "1px solid rgba(255,100,100,0.2)" }}>
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("Nombre completo",
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        )}
        {field("DNI",
          <input
            type="text"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            placeholder="Opcional"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        )}
        {field("Teléfono",
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Opcional"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        )}
        {field("Email",
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Opcional"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        )}
        {field("Localidad",
          <LocalityCombobox
            value={form.locality}
            onValueChange={(v) => setForm({ ...form, locality: v })}
          />
        )}
        {field("Dirección",
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Opcional"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
          />
        )}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
            Fecha de nacimiento
          </label>
          <DateWheelPicker
            value={form.birth_date}
            onChange={(v) => setForm({ ...form, birth_date: v })}
            placeholder="Opcional"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Client Detail View ───────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#1d4ed8", "#b91c1c", "#0369a1", "#3730a3", "#047857",
  "#7c3aed", "#c2410c", "#0f766e", "#9333ea", "#be185d",
]

export function ClientDetailView({
  initialClient,
  initialPolicies,
  companies,
  initialPolicyId,
}: {
  initialClient: Client
  initialPolicies: Policy[]
  companies: Company[]
  initialPolicyId?: string
}) {
  const [client, setClient] = useState<Client>(initialClient)
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [viewPolicyId, setViewPolicyId] = useState<string | null>(initialPolicyId ?? null)

  const initials = getInitials(client.full_name)
  const avatarColor = AVATAR_COLORS[client.full_name.charCodeAt(0) % AVATAR_COLORS.length]

  const handleClientSave = (updated: Client) => {
    setClient(updated)
    setIsEditingClient(false)
  }

  const handlePolicyUpdate = (updated: Policy) => {
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const selectedPolicy = viewPolicyId ? policies.find((p) => p.id === viewPolicyId) ?? null : null

  // Notes inline edit (separate from client edit form)
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(client.notes ?? "")
  const [savingNote, setSavingNote] = useState(false)

  const handleSaveNote = async () => {
    setSavingNote(true)
    const res = await updateClient(client.id, {
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      dni: client.dni,
      address: client.address,
      locality: client.locality,
      birth_date: client.birth_date,
      notes: noteValue.trim(),
    })
    if (!res.error) {
      setClient((prev) => ({ ...prev, notes: noteValue.trim() || "" }))
      setEditingNote(false)
    }
    setSavingNote(false)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm" style={{ color: "var(--sp-text-muted)" }}>
        <Link
          href="/asegurados"
          className="transition-colors"
          style={{ color: "var(--sp-text-muted)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sp-text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sp-text-muted)")}
        >
          Asegurados
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span style={{ color: "var(--sp-text)" }} className="font-medium">{client.full_name}</span>
      </div>

      {/* Client section — header or inline edit form */}
      {isEditingClient ? (
        <ClientEditForm
          client={client}
          companies={companies}
          onSave={handleClientSave}
          onCancel={() => setIsEditingClient(false)}
        />
      ) : (
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--sp-surface)",
            border: "1px solid var(--sp-border)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0"
              style={{ backgroundColor: avatarColor, color: "#fff" }}
            >
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-xl font-extrabold" style={{ color: "var(--sp-text)" }}>{client.full_name}</h1>
                <p className="text-sm" style={{ color: "var(--sp-text-muted)" }}>
                  {policies.length} póliza{policies.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-4">
                {client.dni && <ContactRow icon={IdCard} label="DNI" value={client.dni} />}
                {client.phone && <ContactRow icon={Phone} label="Tel" value={client.phone} href={`tel:${client.phone}`} />}
                {client.email && <ContactRow icon={Mail} label="Email" value={client.email} href={`mailto:${client.email}`} truncate />}
                {client.locality && <ContactRow icon={MapPin} label="Localidad" value={client.locality} />}
                {client.address && <ContactRow icon={Home} label="Dirección" value={client.address} />}
                {client.birth_date && (
                  <ContactRow icon={Calendar} label="Nacimiento" value={
                    format(parseISO(client.birth_date), "d 'de' MMMM yyyy", { locale: es })
                  } />
                )}
              </div>
            </div>

            {/* Edit button */}
            <div className="shrink-0">
              <button
                onClick={() => setIsEditingClient(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  cursor: "pointer",
                  background: "rgba(77,142,255,0.12)",
                  border: "1px solid rgba(77,142,255,0.28)",
                  color: "var(--sp-accent)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(77,142,255,0.22)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(77,142,255,0.12)" }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar datos
              </button>
            </div>
          </div>

          {/* Notes — inline editable, separate from edit form */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--sp-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--sp-amber)" }} />
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--sp-amber)" }}>
                  Nota del asegurado
                </p>
              </div>
              {!editingNote && (
                <button
                  type="button"
                  onClick={() => { setNoteValue(client.notes ?? ""); setEditingNote(true) }}
                  className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
                  style={{ cursor: "pointer", background: "none", border: "none", padding: 0, color: "var(--sp-text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-text)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-muted)" }}
                >
                  <Pencil className="h-3 w-3" />
                  {client.notes ? "Editar" : "Agregar"}
                </button>
              )}
            </div>

            {editingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  placeholder="Observaciones sobre el asegurado..."
                  rows={3}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(173,198,255,0.5)",
                    backgroundColor: "var(--sp-surface-low)",
                    color: "var(--sp-text)",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ cursor: "pointer", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)", background: "none" }}
                  >
                    Cancelar
                  </button>
                  {client.notes && (
                    <button
                      type="button"
                      onClick={async () => {
                        setNoteValue("")
                        setSavingNote(true)
                        const res = await updateClient(client.id, {
                          full_name: client.full_name, phone: client.phone, email: client.email,
                          dni: client.dni, address: client.address, locality: client.locality,
                          birth_date: client.birth_date, notes: "",
                        })
                        if (!res.error) { setClient((prev) => ({ ...prev, notes: "" })); setEditingNote(false) }
                        setSavingNote(false)
                      }}
                      disabled={savingNote}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ cursor: "pointer", color: "var(--sp-red, #ef4444)", border: "1px solid rgba(239,68,68,0.3)", background: "none" }}
                    >
                      Borrar nota
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ cursor: "pointer", background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42", border: "none" }}
                  >
                    {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Guardar nota
                  </button>
                </div>
              </div>
            ) : client.notes ? (
              <div className="flex items-start gap-2">
                <p
                  className="flex-1 text-sm px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--sp-amber-soft)", borderLeft: "2px solid var(--sp-amber)", color: "var(--sp-amber)" }}
                >
                  {client.notes}
                </p>
                <button
                  type="button"
                  title="Borrar nota"
                  onClick={async () => {
                    setSavingNote(true)
                    const res = await updateClient(client.id, {
                      full_name: client.full_name, phone: client.phone, email: client.email,
                      dni: client.dni, address: client.address, locality: client.locality,
                      birth_date: client.birth_date, notes: "",
                    })
                    if (!res.error) setClient((prev) => ({ ...prev, notes: "" }))
                    setSavingNote(false)
                  }}
                  disabled={savingNote}
                  style={{ cursor: "pointer", background: "none", border: "none", padding: 4, color: "var(--sp-text-faint)", marginTop: 4 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-red)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-faint)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--sp-text-faint)" }}>Sin notas registradas</p>
            )}
          </div>
        </div>
      )}

      {/* Policy full-page view — shown when a policy is selected */}
      {!isEditingClient && selectedPolicy && (
        <div className="space-y-4">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setViewPolicyId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ cursor: "pointer", color: "var(--sp-text-muted)", background: "none", border: "none", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--sp-text)" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sp-text-muted)" }}
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Volver a pólizas
          </button>

          {/* Policy full view */}
          <PolicyAccordionPanel
            policy={selectedPolicy}
            companies={companies}
            onClose={() => setViewPolicyId(null)}
            onUpdate={handlePolicyUpdate}
          />
        </div>
      )}

      {/* Policies list — only shown when not editing client and no policy selected */}
      {!isEditingClient && !selectedPolicy && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--sp-text-muted)" }}>
            Pólizas ({policies.length})
          </h2>

          {policies.length === 0 ? (
            <div
              className="rounded-xl py-12 flex items-center justify-center"
              style={{ border: "1px dashed var(--sp-border-strong)" }}
            >
              <p className="text-sm" style={{ color: "var(--sp-text-faint)" }}>Sin pólizas registradas</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
              {policies.map((policy, idx) => {
                const Icon = BRANCH_ICONS[policy.branch] ?? Shield
                return (
                  <div key={policy.id}>
                    {/* Policy row */}
                    <button
                      type="button"
                      onClick={() => setViewPolicyId(policy.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                      style={{
                        cursor: "pointer",
                        backgroundColor: "var(--sp-surface)",
                        borderBottom: idx < policies.length - 1 ? "1px solid var(--sp-border)" : undefined,
                        outline: "none",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
                    >
                      {/* Branch icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--sp-accent-soft)" }}
                      >
                        <Icon className="h-4 w-4" style={{ color: "var(--sp-accent)" }} />
                      </div>

                      {/* Branch + company + extra info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold" style={{ color: "var(--sp-text)" }}>{policy.branch}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs" style={{ color: "var(--sp-text-muted)" }}>{policy.companies?.name ?? "—"}</span>
                          {policy.policy_number && (
                            <span className="text-[10px]" style={{ color: "var(--sp-text-faint)" }}>
                              Póliza #{policy.policy_number}
                            </span>
                          )}
                          {policy.first_payment_date && (
                            <span className="text-[10px]" style={{ color: "var(--sp-text-faint)" }}>
                              Desde {format(parseISO(policy.first_payment_date), "MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plate */}
                      {policy.vehicle_plate && (
                        <div className="shrink-0 text-right hidden sm:block">
                          <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--sp-text-faint)" }}>Patente</p>
                          <span
                            className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                            style={{ backgroundColor: "var(--sp-surface-low)", border: "1px solid var(--sp-border)", color: "var(--sp-text-muted)" }}
                          >
                            {policy.vehicle_plate}
                          </span>
                        </div>
                      )}

                      {/* Active pill */}
                      <span
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                        style={
                          policy.is_active
                            ? { backgroundColor: "rgba(74,225,118,0.1)", color: "var(--sp-green)", border: "1px solid rgba(74,225,118,0.25)" }
                            : { backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)" }
                        }
                      >
                        {policy.is_active ? "Activa" : "Inactiva"}
                      </span>

                      {/* Chevron */}
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--sp-text-faint)" }} />
                    </button>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ContactRow helper ────────────────────────────────────────────────────────

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  truncate = false,
}: {
  icon: React.ElementType
  label: string
  value: string
  href?: string
  truncate?: boolean
}) {
  const content = (
    <div className={`flex items-center gap-1.5 text-sm ${truncate ? "min-w-0" : ""}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--sp-text-muted)" }} />
      <span style={{ color: "var(--sp-text-muted)" }}>{label}:</span>
      <span className={`font-medium ${truncate ? "truncate" : ""}`} style={{ color: "var(--sp-text)" }}>{value}</span>
    </div>
  )

  if (href) {
    return (
      <a href={href} className="hover:opacity-80 transition-opacity" style={{ color: "inherit", textDecoration: "none" }}>
        {content}
      </a>
    )
  }
  return content
}
