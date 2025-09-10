"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, AlertTriangle, CheckCircle, Clock, ArrowLeft, User } from "lucide-react"
import { PaymentDialog } from "@/components/payment-dialog"
import { updateNoticeStatus, getCurrentUser, getNoticesForDisplay } from "@/app/actions/notices"

interface PolicyNotice {
  id: string
  due_date: string
  status: "avisar" | "avisado" | "pagado"
  paid_installments: number
  notified_by?: string | null
  policies: {
    id: string
    branch: string
    vehicle_plate?: string
    first_payment_date: string
    clients: {
      id: string
      full_name: string
      phone?: string
      email?: string
    }
    companies: {
      id: string
      name: string
    }
  }
}

interface NoticesSectionProps {
  notices: PolicyNotice[]
}

export function NoticesSection({ notices: initialNotices }: NoticesSectionProps) {
  const [notices, setNotices] = useState<PolicyNotice[]>(initialNotices)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<PolicyNotice | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("")

  useEffect(() => {
    const getUserAndSetupPolling = async () => {
      const userResult = await getCurrentUser()
      if (userResult.data?.email) {
        setCurrentUserEmail(userResult.data.email)
      }
    }

    getUserAndSetupPolling()

    const interval = setInterval(async () => {
      const result = await getNoticesForDisplay()
      if (result.data) {
        setNotices(result.data)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredNotices = useMemo(() => {
    if (!searchTerm) return notices

    const term = searchTerm.toLowerCase()
    return notices.filter(
      (notice) =>
        notice.policies.clients.full_name.toLowerCase().includes(term) ||
        notice.policies.companies.name.toLowerCase().includes(term) ||
        notice.policies.branch.toLowerCase().includes(term) ||
        notice.policies.vehicle_plate?.toLowerCase().includes(term),
    )
  }, [notices, searchTerm])

  const groupedNotices = useMemo(() => {
    const avisar = filteredNotices.filter((notice) => notice.status === "avisar")
    const avisados = filteredNotices.filter((notice) => notice.status === "avisado")
    const pagados = filteredNotices.filter((notice) => notice.status === "pagado")

    return { avisar, avisados, pagados }
  }, [filteredNotices])

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalizar a medianoche

    const due = new Date(dueDate + "T00:00:00") // Forzar zona horaria local
    due.setHours(0, 0, 0, 0) // Normalizar a medianoche

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "bg-red-100 text-red-800 border-red-200"
    if (daysUntilDue <= 7) return "bg-orange-100 text-orange-800 border-orange-200"
    if (daysUntilDue <= 15) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  const getStatusText = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return `Vencido hace ${Math.abs(daysUntilDue)} días`
    if (daysUntilDue === 0) return "Vence hoy"
    if (daysUntilDue === 1) return "Vence mañana"
    return `Vence en ${daysUntilDue} días`
  }

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
      const result = await updateNoticeStatus(noticeId, newStatus, currentUserEmail)
      if (result.data) {
        setNotices(
          notices.map((notice) =>
            notice.id === noticeId
              ? {
                  ...notice,
                  status: newStatus,
                  notified_by:
                    newStatus === "avisado"
                      ? currentUserEmail.split("@")[0]
                      : newStatus === "avisar"
                        ? null
                        : notice.notified_by,
                }
              : notice,
          ),
        )
      }
    } catch (error) {
      console.error("Error updating notice status:", error)
    }
  }

  const handlePaymentComplete = (updatedNotice: PolicyNotice) => {
    setNotices(notices.map((notice) => (notice.id === updatedNotice.id ? updatedNotice : notice)))
    setPaymentDialogOpen(false)
    setSelectedNotice(null)
  }

  const renderNoticeCard = (notice: PolicyNotice) => {
    const daysUntilDue = getDaysUntilDue(notice.due_date)
    const statusColor = getStatusColor(daysUntilDue)
    const statusText = getStatusText(daysUntilDue)

    return (
      <Card key={notice.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{notice.policies.clients.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{notice.policies.companies.name}</p>
            </div>
            <Badge variant="outline" className={statusColor}>
              {statusText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rama:</span>
              <span className="font-medium">{notice.policies.branch}</span>
            </div>
            {notice.policies.vehicle_plate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patente:</span>
                <span className="font-medium">{notice.policies.vehicle_plate}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vencimiento:</span>
              <span className="font-medium">{new Date(notice.due_date + "T00:00:00").toLocaleDateString("es-ES")}</span>
            </div>
            {notice.policies.clients.phone && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{notice.policies.clients.phone}</span>
              </div>
            )}
            {notice.notified_by && (notice.status === "avisado" || notice.status === "pagado") && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avisado por:</span>
                <span className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {notice.notified_by}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            {notice.status === "avisar" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(notice.id, "avisado")}
                className="flex-1 gap-1 bg-transparent"
              >
                <CheckCircle className="h-3 w-3" />
                Avisado
              </Button>
            )}

            {notice.status === "avisado" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(notice.id, "avisar")}
                  className="gap-1 bg-transparent"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Avisar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(notice.id, "pagado")}
                  className="flex-1 gap-1 bg-transparent"
                >
                  <CheckCircle className="h-3 w-3" />
                  Pagado
                </Button>
              </>
            )}

            {notice.status === "pagado" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(notice.id, "avisado")}
                className="gap-1 bg-transparent"
              >
                <ArrowLeft className="h-3 w-3" />
                Avisado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex justify-start">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar avisos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avisar Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-foreground">Avisar ({groupedNotices.avisar.length})</h2>
          </div>
          <div className="space-y-3">
            {groupedNotices.avisar.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">No hay avisos pendientes</p>
                </CardContent>
              </Card>
            ) : (
              groupedNotices.avisar.map(renderNoticeCard)
            )}
          </div>
        </div>

        {/* Avisados Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-foreground">Avisados ({groupedNotices.avisados.length})</h2>
          </div>
          <div className="space-y-3">
            {groupedNotices.avisados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">No hay clientes avisados</p>
                </CardContent>
              </Card>
            ) : (
              groupedNotices.avisados.map(renderNoticeCard)
            )}
          </div>
        </div>

        {/* Pagados Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-foreground">Pagados ({groupedNotices.pagados.length})</h2>
          </div>
          <div className="space-y-3">
            {groupedNotices.pagados.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">No hay pagos registrados</p>
                </CardContent>
              </Card>
            ) : (
              groupedNotices.pagados.map(renderNoticeCard)
            )}
          </div>
        </div>
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
