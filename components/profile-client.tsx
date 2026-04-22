"use client"

import { useState, useEffect } from "react"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { Sun, Moon, Save, User, Mail, Palette, Check, Loader2 } from "lucide-react"
import { updateDisplayName } from "@/app/actions/profile"
import { toast } from "sonner"

interface ProfileClientProps {
  initialDisplayName: string
  email: string
}

export function ProfileClient({ initialDisplayName, email }: ProfileClientProps) {
  const { theme, applyTheme } = useThemeTransition()
  const [mounted, setMounted] = useState(false)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"

  const handleSaveName = async () => {
    if (!displayName.trim() || displayName.trim() === initialDisplayName) return
    setSaving(true)
    const result = await updateDisplayName(displayName)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setSaved(true)
      toast.success("Nombre actualizado correctamente")
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return name.slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (
    <div className="px-8 py-10 max-w-2xl mx-auto space-y-6">

      {/* Avatar + identity card */}
      <div
        className="rounded-xl p-6 flex items-center gap-5"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black shrink-0"
          style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42" }}
        >
          {displayName ? getInitials(displayName) : <User className="h-7 w-7" />}
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--sp-text)" }}>
            {displayName || "Sin nombre"}
          </p>
          <p className="text-sm" style={{ color: "var(--sp-text-muted)" }}>{email}</p>
        </div>
      </div>

      {/* Display name */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4" style={{ color: "var(--sp-accent-text)" }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
            Nombre de usuario
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
          Este nombre aparece en el saludo del dashboard y en los avisos que marcás como avisado.
        </p>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
              placeholder="Tu nombre..."
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--sp-surface-low)",
                border: "1px solid var(--sp-border-strong)",
                color: "var(--sp-text)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(173,198,255,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sp-border-strong)")}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
          </div>
          <button
            onClick={handleSaveName}
            disabled={saving || !displayName.trim() || displayName.trim() === initialDisplayName}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: saved
                ? "linear-gradient(135deg, #4ae176, #00a74b)"
                : "linear-gradient(135deg, #adc6ff, #4d8eff)",
              color: "#001a42",
            }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Email (read-only) */}
      <div
        className="rounded-xl p-6 space-y-3"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4" style={{ color: "var(--sp-accent-text)" }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
            Correo electrónico
          </h2>
        </div>
        <div
          className="px-4 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--sp-surface-low)",
            border: "1px solid var(--sp-border)",
            color: "var(--sp-text-muted)",
          }}
        >
          {email}
        </div>
        <p className="text-xs" style={{ color: "var(--sp-text-faint)" }}>
          El correo no puede modificarse desde aquí.
        </p>
      </div>

      {/* Theme toggle */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "var(--sp-surface)",
          border: "1px solid var(--sp-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-4 w-4" style={{ color: "var(--sp-accent-text)" }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--sp-text)" }}>
            Apariencia
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--sp-text-muted)" }}>
          Elegí entre el modo oscuro o claro según tu preferencia.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Dark mode */}
          <button
            onClick={() => applyTheme("dark")}
            className="relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all"
            style={{
              backgroundColor: isDark ? "rgba(173,198,255,0.08)" : "var(--sp-surface-low)",
              border: isDark ? "2px solid #adc6ff" : "2px solid var(--sp-border)",
            }}
          >
            {isDark && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#adc6ff", color: "#001a42" }}
              >
                <Check className="h-3 w-3" />
              </div>
            )}
            {/* Dark preview */}
            <div className="w-full h-16 rounded-lg overflow-hidden" style={{ backgroundColor: "#111319" }}>
              <div className="h-3 w-full" style={{ backgroundColor: "#1e1f26" }} />
              <div className="flex gap-1 p-2">
                <div className="h-8 w-8 rounded-md" style={{ backgroundColor: "#1e1f26" }} />
                <div className="flex-1 space-y-1">
                  <div className="h-2 rounded" style={{ backgroundColor: "#1e1f26", width: "70%" }} />
                  <div className="h-2 rounded" style={{ backgroundColor: "#1e1f26", width: "50%" }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon className="h-4 w-4" style={{ color: isDark ? "#adc6ff" : "var(--sp-text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: isDark ? "var(--sp-accent-text)" : "var(--sp-text-muted)" }}>
                Modo oscuro
              </span>
            </div>
          </button>

          {/* Light mode */}
          <button
            onClick={() => applyTheme("light")}
            className="relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all"
            style={{
              backgroundColor: !isDark ? "rgba(77,142,255,0.08)" : "var(--sp-surface-low)",
              border: !isDark ? "2px solid #4d8eff" : "2px solid var(--sp-border)",
            }}
          >
            {!isDark && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#4d8eff", color: "#fff" }}
              >
                <Check className="h-3 w-3" />
              </div>
            )}
            {/* Light preview */}
            <div className="w-full h-16 rounded-lg overflow-hidden" style={{ backgroundColor: "#f0f2f8", border: "1px solid #e0e3ee" }}>
              <div className="h-3 w-full" style={{ backgroundColor: "#ffffff" }} />
              <div className="flex gap-1 p-2">
                <div className="h-8 w-8 rounded-md" style={{ backgroundColor: "#ffffff" }} />
                <div className="flex-1 space-y-1">
                  <div className="h-2 rounded" style={{ backgroundColor: "#e0e3ee", width: "70%" }} />
                  <div className="h-2 rounded" style={{ backgroundColor: "#e0e3ee", width: "50%" }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="h-4 w-4" style={{ color: !isDark ? "#4d8eff" : "var(--sp-text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: !isDark ? "#4d8eff" : "var(--sp-text-muted)" }}>
                Modo claro
              </span>
            </div>
          </button>
        </div>
      </div>

    </div>
  )
}
