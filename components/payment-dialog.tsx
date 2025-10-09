"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard } from "lucide-react"
import { processPayment } from "@/app/actions/notices"

import type { PolicyNotice } from "@/types/index"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: PolicyNotice | null
  onSuccess: (updatedNotice: PolicyNotice) => void
}

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
      const result = await processPayment(notice.id, Number.parseInt(installments))

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onSuccess(result.data)
        setInstallments("1")
      }
    } catch (err) {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setInstallments("1")
        setError("")
      }
    }
  }

  if (!notice) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Registrar Pago
            </DialogTitle>
            <DialogDescription>
              Cliente: <strong>{notice.policies.clients.full_name}</strong>
              <br />
              Póliza: {notice.policies.branch} - {notice.policies.companies.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">¿Cuántas cuotas pagó el cliente?</Label>
              <RadioGroup value={installments} onValueChange={setInstallments} disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="1-installment" />
                  <Label htmlFor="1-installment" className="cursor-pointer">
                    1 cuota (próximo cobro en 1 mes)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="2-installments" />
                  <Label htmlFor="2-installments" className="cursor-pointer">
                    2 cuotas (próximo cobro en 2 meses)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="3-installments" />
                  <Label htmlFor="3-installments" className="cursor-pointer">
                    3 cuotas (próximo cobro en 3 meses)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
