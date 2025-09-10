"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Avisos", href: "/avisos" },
  { name: "Compañías", href: "/companias" },
  { name: "Asegurados", href: "/asegurados" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/avisos" className="text-2xl font-bold text-foreground">
              SiniPro
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
