"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Locality {
  id: string
  nombre: string
  provincia: {
    nombre: string
  }
}

interface LocalityComboboxProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

// Normalize text for search (remove accents and convert to lowercase)
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function LocalityCombobox({ value, onValueChange, disabled }: LocalityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Priority localities that should always appear
  const priorityLocalities = ["Picun Leufu", "Plaza Huincul", "Cutral Co"]

  useEffect(() => {
    const fetchLocalities = async () => {
      if (searchTerm.length < 2) {
        // Show priority localities when no search term
        const priorityData = priorityLocalities.map((name, index) => ({
          id: `priority-${index}`,
          nombre: name,
          provincia: { nombre: "Neuquén" },
        }))
        setLocalities(priorityData)
        return
      }

      setLoading(true)
      try {
        const normalizedSearch = normalizeText(searchTerm)
        const response = await fetch(
          `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(searchTerm)}&max=20&campos=id,nombre,provincia.nombre`,
        )

        if (response.ok) {
          const data = await response.json()
          const fetchedLocalities = data.localidades || []

          // Add priority localities if they match the search
          const matchingPriorities = priorityLocalities
            .filter((priority) => normalizeText(priority).includes(normalizedSearch))
            .map((name) => ({
              id: `priority-${name}`,
              nombre: name,
              provincia: { nombre: "Neuquén" },
            }))

          // Combine and deduplicate
          const allLocalities = [...matchingPriorities, ...fetchedLocalities]
          const uniqueLocalities = allLocalities.filter(
            (locality, index, self) => index === self.findIndex((l) => l.nombre === locality.nombre),
          )

          setLocalities(uniqueLocalities)
        }
      } catch (error) {
        console.error("Error fetching localities:", error)
        // Fallback to priority localities on error
        const priorityData = priorityLocalities
          .filter((priority) => normalizeText(priority).includes(normalizeText(searchTerm)))
          .map((name) => ({
            id: `priority-${name}`,
            nombre: name,
            provincia: { nombre: "Neuquén" },
          }))
        setLocalities(priorityData)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchLocalities, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {value || "Seleccionar localidad..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar localidad..." value={searchTerm} onValueChange={setSearchTerm} />
          <CommandList>
            <CommandEmpty>{loading ? "Buscando..." : "No se encontraron localidades."}</CommandEmpty>
            <CommandGroup>
              {localities.map((locality) => (
                <CommandItem
                  key={locality.id}
                  value={locality.nombre}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue.toLowerCase() === value.toLowerCase() ? "" : locality.nombre)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value.toLowerCase() === locality.nombre.toLowerCase() ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{locality.nombre}</span>
                    <span className="text-xs text-muted-foreground">{locality.provincia.nombre}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
