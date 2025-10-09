"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare } from "lucide-react"
import { addNoteToNotice } from "@/app/actions/notices"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Note {
  id: string
  note: string
  created_at: string
  user_profiles: {
    display_name: string
  } | null
}

interface PolicyNotice {
  id: string
  policies: {
    clients: {
      full_name: string
    }
  }
  notice_notes: Note[]
}

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: PolicyNotice | null
  onSuccess: (noticeId: string, newNote: Note) => void
}

export function NoteDialog({ open, onOpenChange, notice, onSuccess }: NoteDialogProps) {
  const [newNote, setNewNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notice || !newNote.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const result = await addNoteToNotice(notice.id, newNote.trim())

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onSuccess(notice.id, result.data as any)
        setNewNote("")
      }
    } catch (err) {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setNewNote("")
        setError("")
      }
    }
  }

  if (!notice) return null

  // Usamos (notice.notice_notes || []) para asegurarnos de que siempre sea un array
  const notes = notice.notice_notes || []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notas del Aviso
          </DialogTitle>
          <DialogDescription>
            Cliente: <strong>{notice.policies.clients.full_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <ScrollArea className="h-48 w-full rounded-md border p-4">
            <div className="space-y-4">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="text-sm">
                    <p className="font-medium">
                      {note.user_profiles?.display_name || "Usuario desconocido"}
                    </p>
                    <p className="text-muted-foreground">{note.note}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(note.created_at).toLocaleString("es-AR")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay notas todavía.</p>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe una nueva nota..."
              disabled={isLoading}
              rows={3}
            />
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !newNote.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Agregar Nota
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}