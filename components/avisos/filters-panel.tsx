"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateWheelPicker } from "@/components/ui/date-wheel-picker"
import { POLICY_BRANCHES } from "@/types"
import type { NoticeFilters } from "@/types"

interface FiltersPanelProps {
  companies: { id: string; name: string }[]
  filters: NoticeFilters
  onChange: (filters: NoticeFilters) => void
}

export function FiltersPanel({ companies, filters, onChange }: FiltersPanelProps) {
  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== "todos" && v !== ""
  )

  const update = (key: keyof NoticeFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined })
  }

  const clear = () => onChange({})

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Cliente, póliza N°, patente..."
          className="pl-8 h-9 text-sm"
          value={filters.search ?? ""}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>

      {/* Company */}
      <Select
        value={filters.companyId ?? "all"}
        onValueChange={(v) => update("companyId", v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[150px] text-sm">
          <SelectValue placeholder="Compañía" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las compañías</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Branch */}
      <Select
        value={filters.branch ?? "all"}
        onValueChange={(v) => update("branch", v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[160px] text-sm">
          <SelectValue placeholder="Rama" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las ramas</SelectItem>
          {POLICY_BRANCHES.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status ?? "todos"}
        onValueChange={(v) => update("status", v === "todos" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-[130px] text-sm">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="avisar">Avisar</SelectItem>
          <SelectItem value="avisado">Avisado</SelectItem>
          <SelectItem value="pagado">Pagado</SelectItem>
        </SelectContent>
      </Select>

      {/* Date from — drum picker */}
      <DateWheelPicker
        value={filters.dateFrom ?? ""}
        onChange={(v) => update("dateFrom", v)}
        placeholder="Desde"
      />

      {/* Date to — drum picker */}
      <DateWheelPicker
        value={filters.dateTo ?? ""}
        onChange={(v) => update("dateTo", v)}
        placeholder="Hasta"
      />

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 text-muted-foreground hover:text-foreground">
          <X className="mr-1 h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
