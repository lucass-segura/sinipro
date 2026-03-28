"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Loader2, CreditCard, Check } from "lucide-react"
import { processPayment } from "@/app/actions/notices"
import type { PolicyNotice } from "@/types/index"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: PolicyNotice | null
  onSuccess: (updatedNotice: PolicyNotice) => void
}

const installmentOptions = [
  { value: "1", label: "1 cuota", sublabel: "Próximo cobro en 1 mes" },
  { value: "2", label: "2 cuotas", sublabel: "Próximo cobro en 2 meses" },
  { value: "3", label: "3 cuotas", sublabel: "Próximo cobro en 3 meses" },
]

export function PaymentDialog({ open, onOpenChange, notice, onSuccess }: PaymentDialogProps) {
  const [installments, setInstallments] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notice) return
    setIsLoading(true)
    setError("")
    try {
      const result = await processPayment(notice.id, parseInt(installments))
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onSuccess(result.data)
        setInstallments("1")
      }
    } catch {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) { setInstallments("1"); setError("") }
    }
  }

  if (!notice) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[420px]"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--sp-green-soft)" }}
            >
              <CreditCard className="h-5 w-5" style={{ color: "var(--sp-green)" }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--sp-text)" }}>
                Registrar Pago
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                {notice.policies.clients.full_name} · {notice.policies.branch}
              </p>
            </div>
          </div>

          {/* Installment selection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sp-text-muted)" }}>
              ¿Cuántas cuotas pagó el cliente?
            </p>
            <div className="space-y-2">
              {installmentOptions.map((opt) => {
                const isSelected = installments === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInstallments(opt.value)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all"
                    style={{
                      backgroundColor: isSelected ? "var(--sp-green-soft)" : "var(--sp-surface-low)",
                      border: `1px solid ${isSelected ? "var(--sp-green)" : "var(--sp-border)"}`,
                      color: "var(--sp-text)",
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[11px] mt-0.5" style={{ color: "var(--sp-text-muted)" }}>{opt.sublabel}</span>
                    </div>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "var(--sp-green)", color: "#fff" }}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--sp-red-soft)",
                border: "1px solid var(--sp-red)",
                color: "var(--sp-red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--sp-border)" }}>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #4ae176, #00a74b)", color: "#001a42" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Pago
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
