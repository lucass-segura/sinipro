"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface SpPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (p: number) => void
}

export function SpPagination({ page, totalPages, totalItems, pageSize, onPageChange }: SpPaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  // Build page numbers: always show first, last, current ±1, with ellipsis
  const pages: (number | "…")[] = []
  const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n) }

  addPage(1)
  if (page > 3) pages.push("…")
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) addPage(i)
  if (page < totalPages - 2) pages.push("…")
  if (totalPages > 1) addPage(totalPages)

  const btnBase: React.CSSProperties = {
    cursor: "pointer",
    border: "1px solid var(--sp-border)",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    transition: "all .15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    height: 32,
    padding: "0 6px",
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
        {from}–{to} de {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{
            ...btnBase,
            color: page === 1 ? "var(--sp-text-faint)" : "var(--sp-text-muted)",
            backgroundColor: "var(--sp-surface)",
            cursor: page === 1 ? "default" : "pointer",
          }}
          onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs" style={{ color: "var(--sp-text-faint)" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={{
                ...btnBase,
                backgroundColor: p === page ? "var(--sp-accent)" : "var(--sp-surface)",
                color: p === page ? "#fff" : "var(--sp-text-muted)",
                borderColor: p === page ? "transparent" : "var(--sp-border)",
              }}
              onMouseEnter={(e) => { if (p !== page) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
              onMouseLeave={(e) => { if (p !== page) e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{
            ...btnBase,
            color: page === totalPages ? "var(--sp-text-faint)" : "var(--sp-text-muted)",
            backgroundColor: "var(--sp-surface)",
            cursor: page === totalPages ? "default" : "pointer",
          }}
          onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-surface)" }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
