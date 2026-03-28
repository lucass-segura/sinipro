"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { createPortal } from "react-dom"
import { Plus, Search, User, X, ChevronDown, Loader2 } from "lucide-react"
import { createPolicy, searchClients } from "@/app/actions/policies"
import { createClient } from "@/app/actions/clients"
import { POLICY_BRANCHES } from "@/types"
import { toast } from "sonner"
import { DateWheelPicker } from "@/components/ui/date-wheel-picker"

interface Company { id: string; name: string }
interface ClientResult { id: string; full_name: string; phone?: string; email?: string; dni?: string }

interface PolicyDialogProps {
  companies: Company[]
  trigger?: React.ReactNode
  onCreated?: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--sp-border-strong)",
  backgroundColor: "var(--sp-surface-low)",
  color: "var(--sp-text)",
  fontSize: 13,
  outline: "none",
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--sp-text-muted)",
  marginBottom: 4,
}

export function PolicyDialog({ companies, trigger, onCreated }: PolicyDialogProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  // Client selection state
  const [clientMode, setClientMode] = useState<"search" | "new">("search")
  const [clientSearch, setClientSearch] = useState("")
  const [clientResults, setClientResults] = useState<ClientResult[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  // New client fields
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientDni, setNewClientDni] = useState("")

  // Policy fields
  const [branch, setBranch] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [policyNumber, setPolicyNumber] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [firstPaymentDate, setFirstPaymentDate] = useState("")

  const [error, setError] = useState("")

  // Search clients debounced
  useEffect(() => {
    if (clientMode !== "search" || clientSearch.length < 2) {
      setClientResults([])
      return
    }
    setSearching(true)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const res = await searchClients(clientSearch)
      setClientResults(res.data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [clientSearch, clientMode])

  const resetForm = () => {
    setClientMode("search")
    setClientSearch("")
    setClientResults([])
    setSelectedClient(null)
    setNewClientName("")
    setNewClientPhone("")
    setNewClientEmail("")
    setNewClientDni("")
    setBranch("")
    setCompanyId("")
    setPolicyNumber("")
    setVehiclePlate("")
    setFirstPaymentDate("")
    setError("")
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleSubmit = async () => {
    setError("")
    if (!branch) { setError("Seleccioná el ramo"); return }
    if (!companyId) { setError("Seleccioná la compañía"); return }
    if (!firstPaymentDate) { setError("Ingresá la fecha del primer pago"); return }

    if (clientMode === "search" && !selectedClient) {
      setError("Buscá y seleccioná un asegurado"); return
    }
    if (clientMode === "new" && !newClientName.trim()) {
      setError("Ingresá el nombre del asegurado"); return
    }

    startTransition(async () => {
      let clientId = selectedClient?.id ?? ""

      // Create client if new
      if (clientMode === "new") {
        const res = await createClient({
          full_name: newClientName.trim(),
          phone: newClientPhone || undefined,
          email: newClientEmail || undefined,
          dni: newClientDni || undefined,
        })
        if (res.error || !res.data) {
          setError(res.error ?? "Error al crear el asegurado")
          return
        }
        clientId = (res.data as any).id
      }

      // Create policy
      const res = await createPolicy({
        client_id: clientId,
        company_id: companyId,
        branch,
        policy_number: policyNumber || undefined,
        vehicle_plate: vehiclePlate || undefined,
        first_payment_date: firstPaymentDate,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      toast.success("Póliza creada correctamente")
      handleClose()
      onCreated?.()
    })
  }

  const selectStyle: React.CSSProperties = {
    ...INPUT_STYLE,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: 28,
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {trigger ?? (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
          >
            <Plus className="h-3.5 w-3.5" />
            NUEVA PÓLIZA
          </div>
        )}
      </button>
    )
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
        <div
          className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--sp-surface)",
            border: "1px solid var(--sp-border-strong)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--sp-border)" }}
          >
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--sp-text)" }}>Nueva Póliza</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--sp-text-muted)" }}>Completá los datos para registrar la póliza</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
              style={{ color: "var(--sp-text-muted)", cursor: "pointer", border: "none", backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-5">
            {/* Asegurado section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
                  Asegurado
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setClientMode("search"); setSelectedClient(null) }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={clientMode === "search"
                      ? { backgroundColor: "var(--sp-accent)", color: "#fff", border: "none", cursor: "pointer" }
                      : { backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)", cursor: "pointer" }
                    }
                  >
                    Buscar existente
                  </button>
                  <button
                    onClick={() => { setClientMode("new"); setSelectedClient(null) }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={clientMode === "new"
                      ? { backgroundColor: "var(--sp-accent)", color: "#fff", border: "none", cursor: "pointer" }
                      : { backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)", cursor: "pointer" }
                    }
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {clientMode === "search" ? (
                <div className="space-y-2">
                  {selectedClient ? (
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: "var(--sp-accent-soft)", border: "1px solid var(--sp-accent)" }}
                    >
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--sp-accent)", color: "#fff" }}>
                        {selectedClient.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--sp-accent)" }}>{selectedClient.full_name}</p>
                        {selectedClient.phone && <p className="text-[11px]" style={{ color: "var(--sp-text-muted)" }}>{selectedClient.phone}</p>}
                      </div>
                      <button onClick={() => setSelectedClient(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--sp-text-muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--sp-text-muted)" }} />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Buscar por nombre, DNI o email..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        style={{ ...INPUT_STYLE, paddingLeft: 32 }}
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin" style={{ color: "var(--sp-text-muted)" }} />
                      )}
                      {clientResults.length > 0 && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-10"
                          style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border-strong)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                        >
                          {clientResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedClient(c); setClientSearch(""); setClientResults([]) }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
                              style={{ border: "none", cursor: "pointer", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent)" }}>
                                {c.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--sp-text)" }}>{c.full_name}</p>
                                <p className="text-[11px] truncate" style={{ color: "var(--sp-text-muted)" }}>
                                  {[c.phone, c.email, c.dni && `DNI ${c.dni}`].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {clientSearch.length >= 2 && !searching && clientResults.length === 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 px-3 py-3 rounded-lg text-sm" style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)" }}>
                          Sin resultados. Probá con otro término o creá un nuevo asegurado.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label style={LABEL_STYLE}>Nombre completo *</label>
                    <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Ej: Juan Pérez" style={INPUT_STYLE} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={LABEL_STYLE}>Teléfono</label>
                      <input type="text" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="Ej: 351 123 4567" style={INPUT_STYLE} />
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>DNI</label>
                      <input type="text" value={newClientDni} onChange={(e) => setNewClientDni(e.target.value)} placeholder="Ej: 30123456" style={INPUT_STYLE} />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Email</label>
                    <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="correo@ejemplo.com" style={INPUT_STYLE} />
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--sp-border)" }} />

            {/* Policy fields */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: "var(--sp-text)" }}>Datos de la Póliza</span>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={LABEL_STYLE}>Ramo *</label>
                    <select value={branch} onChange={(e) => setBranch(e.target.value)} style={selectStyle}>
                      <option value="">Seleccionar ramo</option>
                      {POLICY_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Compañía *</label>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={selectStyle}>
                      <option value="">Seleccionar compañía</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={LABEL_STYLE}>N° Póliza</label>
                    <input type="text" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="Ej: 123456" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Patente</label>
                    <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} placeholder="Ej: AB123CD" style={{ ...INPUT_STYLE, textTransform: "uppercase" }} />
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Fecha del primer pago *</label>
                  <DateWheelPicker
                    value={firstPaymentDate}
                    onChange={(v) => setFirstPaymentDate(v)}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(147,0,10,0.15)", color: "#ffdad6", border: "1px solid rgba(147,0,10,0.4)" }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex gap-3 px-6 py-4"
            style={{ borderTop: "1px solid var(--sp-border)" }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)", cursor: "pointer", backgroundColor: "transparent" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: isPending ? "var(--sp-surface-low)" : "linear-gradient(135deg, #adc6ff, #4d8eff)",
                color: isPending ? "var(--sp-text-muted)" : "#001a42",
                border: "none",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creando..." : "Crear Póliza"}
            </button>
          </div>
        </div>
    </div>,
    document.body
  )
}
