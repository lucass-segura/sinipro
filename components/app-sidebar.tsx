"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  Building2,
  ShieldAlert,
  FolderOpen,
  MessageSquare,
  LogOut,
  User,
  Menu,
  Shield,
  Sun,
  Moon,
  UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Avisos", href: "/avisos", icon: CalendarDays },
  { name: "Pólizas", href: "/polizas", icon: FileText },
  { name: "Asegurados", href: "/asegurados", icon: Users },
  { name: "Compañías", href: "/companias", icon: Building2 },
]

const adminNav = [
  { name: "Usuarios", href: "/admin/usuarios", icon: UserCog },
]

const futureNav = [
  { name: "Siniestros", href: "/siniestros", icon: ShieldAlert },
  { name: "Archivos", href: "/archivos", icon: FolderOpen },
  { name: "Mensajes", href: "/mensajes", icon: MessageSquare },
]

function NavItem({
  item,
  pathname,
  urgentCount,
  isFuture,
}: {
  item: { name: string; href: string; icon: React.ElementType }
  pathname: string
  urgentCount?: number
  isFuture?: boolean
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const Icon = item.icon

  if (isFuture) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm cursor-default opacity-40">
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1">{item.name}</span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ backgroundColor: "#6f00be22", color: "#ddb7ff", border: "1px solid #6f00be44" }}
        >
          Próximo
        </span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-lg",
        isActive
          ? "font-semibold rounded-l-none"
          : ""
      )}
      style={
        isActive
          ? {
              backgroundColor: "var(--sp-sidebar-active)",
              borderLeft: "3px solid #3b82f6",
              color: "var(--sp-sidebar-accent)",
            }
          : {
              color: "var(--sp-sidebar-text)",
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "var(--sp-sidebar-active)"
          e.currentTarget.style.color = "var(--sp-sidebar-accent)"
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "var(--sp-sidebar-text)"
        }
      }}
    >
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0")}
        style={{ color: isActive ? "var(--sp-sidebar-accent)" : undefined }}
      />
      <span className="flex-1">{item.name}</span>
      {urgentCount !== undefined && urgentCount > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={{ backgroundColor: "#93000a", color: "#ffdad6" }}
        >
          {urgentCount}
        </span>
      )}
    </Link>
  )
}

function SidebarContent({
  pathname,
  urgentCount,
  userName,
  userEmail,
  role,
  onLogout,
  isLoggingOut,
}: {
  pathname: string
  urgentCount: number
  userName: string
  userEmail: string
  role: string
  onLogout: () => void
  isLoggingOut: boolean
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--sp-sidebar-bg)", color: "var(--sp-sidebar-text)" }}>
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #adc6ff, #4d8eff)",
            }}
          >
            <Shield className="h-4 w-4" style={{ color: "#001a42" }} />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--sp-sidebar-accent)" }}>
            SiniPro
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium px-4 mb-2"
            style={{ color: "var(--sp-sidebar-text)" }}
          >
            Principal
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                pathname={pathname}
                urgentCount={item.href === "/avisos" ? urgentCount : undefined}
              />
            ))}
          </div>
        </div>

        {role === "admin" && (
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.15em] font-medium px-4 mb-2"
              style={{ color: "var(--sp-sidebar-text)" }}
            >
              Administración
            </p>
            <div className="space-y-0.5">
              {adminNav.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium px-4 mb-2"
            style={{ color: "var(--sp-sidebar-text)" }}
          >
            Módulos
          </p>
          <div className="space-y-0.5">
            {futureNav.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} isFuture />
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div
        className="px-3 py-4 space-y-1"
        style={{ borderTop: "1px solid var(--sp-sidebar-border)" }}
      >
        <Link
          href="/perfil"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "var(--sp-sidebar-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-sidebar-active)"; e.currentTarget.style.color = "var(--sp-sidebar-accent)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--sp-sidebar-text)" }}
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: "#4d8eff", color: "#001a42" }}
          >
            {userName ? userName.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none truncate" style={{ color: "var(--sp-sidebar-accent)" }}>
              {userName || "Usuario"}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--sp-sidebar-text)" }}>
              {userEmail || ""}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "var(--sp-sidebar-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-sidebar-active)"; e.currentTarget.style.color = "var(--sp-sidebar-accent)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--sp-sidebar-text)" }}
        >
          {mounted && theme === "dark"
            ? <Sun className="h-[18px] w-[18px] shrink-0" />
            : <Moon className="h-[18px] w-[18px] shrink-0" />
          }
          <span>{mounted && theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
        </button>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
          style={{ color: "var(--sp-sidebar-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sp-sidebar-active)"; e.currentTarget.style.color = "var(--sp-sidebar-accent)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--sp-sidebar-text)" }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
        </button>
      </div>
    </div>
  )
}

interface AppSidebarProps {
  urgentCount?: number
  role?: string
}

export function AppSidebar({ urgentCount = 0, role: roleProp }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [role, setRole] = useState(roleProp ?? "broker")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserEmail(user.email || "")
      supabase
        .from("user_profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.display_name) setUserName(data.display_name)
          else if (user.email) setUserName(user.email.split("@")[0])
          if (data?.role) setRole(data.role)
        })
    })
  }, [])

  const handleLogout = async () => {
    const confirmed = window.confirm("¿Está seguro que desea cerrar sesión?")
    if (!confirmed) return
    setIsLoggingOut(true)
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const contentProps = {
    pathname,
    urgentCount,
    userName,
    userEmail,
    role,
    onLogout: handleLogout,
    isLoggingOut,
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0"
        style={{
          backgroundColor: "var(--sp-sidebar-bg)",
          borderRight: "1px solid var(--sp-sidebar-border)",
          boxShadow: "4px 0 24px rgba(59,130,246,0.03)",
        }}
      >
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile topbar + drawer */}
      <div
        className="md:hidden flex items-center justify-between h-14 px-4 sticky top-0 z-50"
        style={{
          backgroundColor: "var(--sp-sidebar-bg)",
          borderBottom: "1px solid var(--sp-sidebar-border)",
          color: "var(--sp-sidebar-text)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)" }}
          >
            <Shield className="h-3.5 w-3.5" style={{ color: "#001a42" }} />
          </div>
          <span className="text-base font-bold" style={{ color: "var(--sp-sidebar-accent)" }}>
            SiniPro
          </span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              style={{ color: "var(--sp-sidebar-text)" }}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" style={{ backgroundColor: "var(--sp-sidebar-bg)" }}>
            <SidebarContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
