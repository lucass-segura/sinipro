"use client"

import { useState, useTransition } from "react"
import { updateUserRole, inviteUser } from "@/app/actions/users"
import { toast } from "sonner"
import { UserCog, Shield, Loader2, Plus, X, Mail, User } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface UserProfile {
  id: string
  display_name: string
  role: string
  created_at?: string
}

interface UsersManagerProps {
  initialUsers: UserProfile[]
  currentUserId: string
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<"broker" | "admin">("broker")
  const [inviting, setInviting] = useState(false)

  const handleRoleChange = (userId: string, newRole: "admin" | "broker") => {
    startTransition(async () => {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      const res = await updateUserRole(userId, newRole)
      if (res.error) {
        toast.error(res.error)
        setUsers(initialUsers)
      } else {
        toast.success("Rol actualizado")
      }
    })
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error("Completá el email y el nombre")
      return
    }
    setInviting(true)
    const res = await inviteUser(inviteEmail.trim(), inviteName.trim(), inviteRole)
    setInviting(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setShowInvite(false)
      setInviteEmail("")
      setInviteName("")
      setInviteRole("broker")
    }
  }

  const INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--sp-border-strong)",
    backgroundColor: "var(--sp-surface-low)",
    color: "var(--sp-text)",
    fontSize: 13,
    outline: "none",
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--sp-text-muted)" }}>
          {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: "linear-gradient(135deg, #adc6ff, #4d8eff)", color: "#001a42", border: "none", cursor: "pointer" }}
        >
          <Plus className="h-3.5 w-3.5" />
          INVITAR USUARIO
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div
          className="mb-6 p-5 rounded-xl"
          style={{ backgroundColor: "var(--sp-surface)", border: "1px solid var(--sp-border-strong)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: "var(--sp-text)" }}>Invitar nuevo usuario</h3>
            <button onClick={() => setShowInvite(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--sp-text-muted)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--sp-text-muted)" }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  placeholder="Nombre Apellido"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--sp-text-muted)" }}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--sp-text-muted)" }}>
                Rol
              </label>
              <div className="flex gap-2">
                {(["broker", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setInviteRole(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={inviteRole === r
                      ? { backgroundColor: "var(--sp-accent)", color: "#fff", border: "none", cursor: "pointer" }
                      : { backgroundColor: "var(--sp-surface-low)", color: "var(--sp-text-muted)", border: "1px solid var(--sp-border)", cursor: "pointer" }
                    }
                  >
                    {r === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {r === "admin" ? "Admin" : "Broker"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ border: "1px solid var(--sp-border-strong)", color: "var(--sp-text-muted)", cursor: "pointer", backgroundColor: "transparent" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "var(--sp-accent)", color: "#fff", border: "none", cursor: inviting ? "not-allowed" : "pointer", opacity: inviting ? 0.7 : 1 }}
              >
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--sp-border)" }}>
        {users.map((user, idx) => (
          <div
            key={user.id}
            className="flex items-center gap-4 px-5 py-4"
            style={{
              backgroundColor: "var(--sp-surface)",
              borderBottom: idx < users.length - 1 ? "1px solid var(--sp-border)" : undefined,
            }}
          >
            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent)" }}
            >
              {user.display_name.charAt(0).toUpperCase()}
            </div>

            {/* Name + date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--sp-text)" }}>
                  {user.display_name}
                </p>
                {user.id === currentUserId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent)" }}>
                    Tú
                  </span>
                )}
              </div>
              {user.created_at && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--sp-text-muted)" }}>
                  Desde {format(parseISO(user.created_at), "d MMM yyyy", { locale: es })}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div className="flex gap-1.5">
              {(["broker", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    if (user.id === currentUserId && r !== "admin") {
                      toast.error("No podés quitarte el rol de admin a ti mismo")
                      return
                    }
                    handleRoleChange(user.id, r)
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={user.role === r
                    ? r === "admin"
                      ? { backgroundColor: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", cursor: isPending ? "not-allowed" : "pointer" }
                      : { backgroundColor: "var(--sp-accent-soft)", color: "var(--sp-accent)", border: "1px solid var(--sp-accent)", cursor: isPending ? "not-allowed" : "pointer" }
                    : { backgroundColor: "transparent", color: "var(--sp-text-faint)", border: "1px solid var(--sp-border)", cursor: isPending ? "not-allowed" : "pointer" }
                  }
                >
                  {r === "admin" ? <Shield className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
                  {r === "admin" ? "Admin" : "Broker"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
