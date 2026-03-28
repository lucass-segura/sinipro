"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }

    if (!validateEmail(email)) {
      setError("Por favor ingresá un correo electrónico válido")
      return
    }

    if (!password.trim()) {
      setError("La contraseña es requerida")
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ backgroundColor: "#0c0e14" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#111319" }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #4b8eff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 40%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: "#414755", opacity: 0.4 }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/Logo de Lucas Segura.png"
            alt="Logo"
            width={120}
            height={48}
            className="object-contain"
          />
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight" style={{ color: "#e2e2eb" }}>
              Sistema de Gestión
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#8b90a0" }}>
              Accedé al panel para gestionar pólizas, avisos y clientes de tu cartera.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs relative z-10" style={{ color: "#414755" }}>
          Uso interno — acceso restringido
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden mb-10">
          <Image
            src="/Logo de Lucas Segura.png"
            alt="Logo"
            width={100}
            height={40}
            className="object-contain"
          />
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold" style={{ color: "#e2e2eb" }}>
              Bienvenido de vuelta
            </h1>
            <p className="text-sm" style={{ color: "#8b90a0" }}>
              Ingresá tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#8b90a0" }}
              >
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 border-0 text-sm transition-all"
                style={{
                  backgroundColor: "#1e1f26",
                  color: "#e2e2eb",
                  outline: "1px solid #414755",
                  borderRadius: "0.5rem",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#8b90a0" }}
              >
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 border-0 text-sm pr-10 transition-all"
                  style={{
                    backgroundColor: "#1e1f26",
                    color: "#e2e2eb",
                    outline: "1px solid #414755",
                    borderRadius: "0.5rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#8b90a0" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "rgba(147, 0, 10, 0.15)",
                  border: "1px solid rgba(255, 180, 171, 0.2)",
                  color: "#ffb4ab",
                }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{
                background: isLoading
                  ? "#282a30"
                  : "linear-gradient(135deg, #adc6ff, #4b8eff)",
                color: isLoading ? "#8b90a0" : "#002e69",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "#414755" }} />
            <span className="text-xs" style={{ color: "#414755" }}>
              SINIPRO v2
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#414755" }} />
          </div>

          <p className="text-center text-xs" style={{ color: "#414755" }}>
            Sistema de uso interno. Solo personal autorizado.
          </p>
        </div>
      </div>
    </div>
  )
}
