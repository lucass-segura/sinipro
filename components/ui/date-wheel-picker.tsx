"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1 // Monday = 0
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

type CalendarView = "days" | "months" | "years"

function YearGrid({
  currentYear,
  onSelect,
}: {
  currentYear: number
  onSelect: (year: number) => void
}) {
  const [page, setPage] = useState(Math.floor(currentYear / 12))
  const startYear = page * 12
  const years = Array.from({ length: 12 }, (_, i) => startYear + i)
  const thisYear = new Date().getFullYear()

  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-3">
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold" style={{ color: "var(--sp-text)" }}>
          {startYear} – {startYear + 11}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelect(y)}
            className="py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              cursor: "pointer",
              color: y === currentYear ? "#fff" : y === thisYear ? "var(--sp-accent)" : "var(--sp-text)",
              backgroundColor: y === currentYear ? "var(--sp-accent)" : "transparent",
            }}
            onMouseEnter={(e) => { if (y !== currentYear) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
            onMouseLeave={(e) => { if (y !== currentYear) e.currentTarget.style.backgroundColor = "transparent" }}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

function MonthGrid({
  currentMonth,
  onSelect,
}: {
  currentMonth: number
  onSelect: (month: number) => void
}) {
  const thisMonth = new Date().getMonth()

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {MONTHS.map((m, i) => (
        <button
          key={m}
          type="button"
          onClick={() => onSelect(i)}
          className="py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            cursor: "pointer",
            color: i === currentMonth ? "#fff" : i === thisMonth ? "var(--sp-accent)" : "var(--sp-text)",
            backgroundColor: i === currentMonth ? "var(--sp-accent)" : "transparent",
          }}
          onMouseEnter={(e) => { if (i !== currentMonth) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
          onMouseLeave={(e) => { if (i !== currentMonth) e.currentTarget.style.backgroundColor = "transparent" }}
        >
          {m.slice(0, 3)}
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DateWheelPicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
}: {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<CalendarView>("days")

  const selected = value ? parseISO(value) : undefined

  const [navYear, setNavYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [navMonth, setNavMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth())

  const displayValue = selected
    ? format(selected, "d 'de' MMMM yyyy", { locale: es })
    : null

  const handleSelect = (day: number) => {
    const d = new Date(navYear, navMonth, day)
    onChange(format(d, "yyyy-MM-dd"))
    setOpen(false)
    setView("days")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setView("days")
      if (selected) {
        setNavYear(selected.getFullYear())
        setNavMonth(selected.getMonth())
      }
    }
  }

  const handlePrevMonth = () => {
    if (navMonth === 0) { setNavMonth(11); setNavYear((y) => y - 1) }
    else setNavMonth((m) => m - 1)
  }

  const handleNextMonth = () => {
    if (navMonth === 11) { setNavMonth(0); setNavYear((y) => y + 1) }
    else setNavMonth((m) => m + 1)
  }

  // Build day grid
  const daysInMonth = getDaysInMonth(navYear, navMonth)
  const firstDay = getFirstDayOfMonth(navYear, navMonth)
  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && navMonth === today.getMonth() && navYear === today.getFullYear()
  const isSelected = (day: number) =>
    selected ? day === selected.getDate() && navMonth === selected.getMonth() && navYear === selected.getFullYear() : false

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-all ${className ?? ""}`}
          style={{
            backgroundColor: "var(--sp-surface)",
            border: "1px solid var(--sp-border-strong)",
            color: displayValue ? "var(--sp-text)" : "var(--sp-text-muted)",
            cursor: "pointer",
            minWidth: 160,
            outline: "none",
          }}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--sp-text-muted)" }} />
          <span className="flex-1 text-left text-sm truncate">
            {displayValue ?? placeholder}
          </span>
          {displayValue && (
            <span onClick={handleClear} style={{ display: "flex", cursor: "pointer" }}>
              <X className="h-3 w-3" style={{ color: "var(--sp-text-muted)" }} />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="p-4 w-[280px]"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border-strong)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        align="start"
      >
        {/* Header: Month / Year clickable */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView(view === "months" ? "days" : "months")}
              className="text-sm font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{
                cursor: "pointer",
                color: view === "months" ? "var(--sp-accent)" : "var(--sp-text)",
                backgroundColor: view === "months" ? "var(--sp-accent-soft)" : "transparent",
              }}
              onMouseEnter={(e) => { if (view !== "months") e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
              onMouseLeave={(e) => { if (view !== "months") e.currentTarget.style.backgroundColor = "transparent" }}
            >
              {MONTHS[navMonth]}
            </button>
            <button
              type="button"
              onClick={() => setView(view === "years" ? "days" : "years")}
              className="text-sm font-semibold px-2 py-0.5 rounded-md transition-colors"
              style={{
                cursor: "pointer",
                color: view === "years" ? "var(--sp-accent)" : "var(--sp-text)",
                backgroundColor: view === "years" ? "var(--sp-accent-soft)" : "transparent",
              }}
              onMouseEnter={(e) => { if (view !== "years") e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
              onMouseLeave={(e) => { if (view !== "years") e.currentTarget.style.backgroundColor = "transparent" }}
            >
              {navYear}
            </button>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ cursor: "pointer", color: "var(--sp-text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Views */}
        {view === "years" && (
          <YearGrid
            currentYear={navYear}
            onSelect={(y) => { setNavYear(y); setView("days") }}
          />
        )}

        {view === "months" && (
          <MonthGrid
            currentMonth={navMonth}
            onSelect={(m) => { setNavMonth(m); setView("days") }}
          />
        )}

        {view === "days" && (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium py-1"
                  style={{ color: "var(--sp-text-faint)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day buttons */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const sel = isSelected(day)
                const tod = isToday(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className="w-full aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
                    style={{
                      cursor: "pointer",
                      color: sel ? "#fff" : tod ? "var(--sp-accent)" : "var(--sp-text)",
                      backgroundColor: sel ? "var(--sp-accent)" : "transparent",
                      fontWeight: tod || sel ? 700 : 400,
                    }}
                    onMouseEnter={(e) => { if (!sel) e.currentTarget.style.backgroundColor = "var(--sp-surface-hover)" }}
                    onMouseLeave={(e) => { if (!sel) e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
