"use client"

import { useTheme } from "next-themes"

export function useThemeTransition() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }
    document.startViewTransition(() => setTheme(next))
  }

  const applyTheme = (newTheme: "dark" | "light") => {
    if (newTheme === theme) return
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }
    document.startViewTransition(() => setTheme(newTheme))
  }

  return { theme, toggleTheme, applyTheme }
}
