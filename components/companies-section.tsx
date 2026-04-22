"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, ShieldAlert, X } from "lucide-react"
import { CompanyDialog } from "@/components/company-dialog"

interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface CompaniesSectionProps {
  companies: Company[]
  policyCountMap: Record<string, number>
  role: string
}

// Deterministic avatar color per company index
const AVATAR_COLORS = [
  "#1d4ed8", // blue-700
  "#b91c1c", // red-700
  "#0369a1", // sky-700
  "#3730a3", // indigo-700
  "#047857", // emerald-700
  "#7c3aed", // violet-600
  "#c2410c", // orange-700
  "#0f766e", // teal-700
  "#9333ea", // purple-600
  "#be185d", // pink-700
]

function getInitials(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function CompaniesSection({ companies: initialCompanies, policyCountMap, role }: CompaniesSectionProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [policyCounts, setPolicyCounts] = useState<Record<string, number>>(policyCountMap)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const isAdmin = role === "admin"

  const handleAddCompany = () => {
    setEditingCompany(null)
    setIsDialogOpen(true)
  }

  const handleEditCompany = (company: Company) => {
    if (!isAdmin) { setShowAdminModal(true); return }
    setEditingCompany(company)
    setIsDialogOpen(true)
  }

  const handleDeleteCompany = () => {
    if (!isAdmin) { setShowAdminModal(true); return }
  }

  const handleCompanyUpdate = (updatedCompany: Company) => {
    if (editingCompany) {
      setCompanies(companies.map((c) => (c.id === updatedCompany.id ? updatedCompany : c)))
    } else {
      setCompanies([...companies, updatedCompany])
    }
    setIsDialogOpen(false)
    setEditingCompany(null)
  }

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--sp-text)" }}>
              Compañías
            </h2>
            <span
              className="text-sm font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--sp-accent-soft)",
                color: "var(--sp-accent-text)",
                border: "1px solid rgba(173,198,255,0.2)",
              }}
            >
              {companies.length}
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--sp-text-muted)" }}>
            Gestión de entidades aseguradoras.
          </p>
        </div>

        <button
          onClick={handleAddCompany}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #adc6ff, #4d8eff)",
            color: "#001a42",
            boxShadow: "0 8px 24px rgba(77,142,255,0.2)",
          }}
        >
          <Plus className="h-4 w-4" />
          AGREGAR COMPAÑÍA
        </button>
      </div>

      {/* Companies grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company, idx) => {
          const initials = getInitials(company.name)
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
          const count = policyCounts[company.id] ?? 0

          return (
            <div
              key={company.id}
              className="group flex flex-col rounded-xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: "var(--sp-surface)",
                border: "1px solid var(--sp-border)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface)")}
            >
              {/* Card body */}
              <div className="p-6 flex items-start gap-4 flex-grow">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: avatarColor, color: "#fff" }}
                >
                  {initials}
                </div>

                <div className="flex-grow min-w-0">
                  <h3
                    className="text-lg font-bold leading-tight transition-colors group-hover:text-[#adc6ff]"
                    style={{ color: "var(--sp-text)" }}
                  >
                    {company.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--sp-text-muted)" }}>
                    {count} póliza{count !== 1 ? "s" : ""} activa{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Card footer */}
              <div
                className="px-6 py-3 flex items-center justify-end"
                style={{
                  backgroundColor: "var(--sp-surface-lowest)",
                  borderTop: "1px solid var(--sp-border)",
                }}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditCompany(company)}
                    title="Editar"
                    className="p-2 rounded-lg transition-all"
                    style={{ color: "var(--sp-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--sp-accent-text)"
                      e.currentTarget.style.backgroundColor = "var(--sp-accent-soft)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--sp-text-muted)"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDeleteCompany}
                    title="Eliminar"
                    className="p-2 rounded-lg transition-all"
                    style={{ color: "var(--sp-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ffb4ab"
                      e.currentTarget.style.backgroundColor = "rgba(147,0,10,0.1)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--sp-text-muted)"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add new company card */}
        <button
          onClick={handleAddCompany}
          className="group flex flex-col items-center justify-center rounded-xl p-8 gap-4 transition-all duration-300 min-h-[180px]"
          style={{
            border: "2px dashed var(--sp-border-strong)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(173,198,255,0.4)"
            e.currentTarget.style.backgroundColor = "var(--sp-accent-soft)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--sp-border-strong)"
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: "var(--sp-surface)" }}
          >
            <Plus className="h-7 w-7 transition-colors" style={{ color: "var(--sp-text-faint)" }} />
          </div>
          <div className="text-center">
            <p className="font-bold transition-colors" style={{ color: "var(--sp-text)" }}>
              Nueva Compañía
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--sp-text-muted)" }}>
              Dar de alta aseguradora
            </p>
          </div>
        </button>
      </div>

      {/* Dialog */}
      <CompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        company={editingCompany}
        onSuccess={handleCompanyUpdate}
      />

      {/* Modal: acción restringida a admin */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--sp-surface)",
              border: "1px solid var(--sp-border-strong)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-all"
              style={{ color: "var(--sp-text-faint)" }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--sp-amber-soft)" }}
              >
                <ShieldAlert className="h-5 w-5" style={{ color: "var(--sp-amber)" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--sp-text)" }}>
                  Acción restringida
                </h3>
                <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
                  Permiso de administrador requerido
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "var(--sp-text-muted)" }}>
              Para editar o eliminar una compañía necesitás comunicarte con un administrador del sistema.
            </p>

            <button
              onClick={() => setShowAdminModal(false)}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-all hover:brightness-110"
              style={{
                backgroundColor: "var(--sp-surface-hover)",
                color: "var(--sp-text)",
                border: "1px solid var(--sp-border-strong)",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
