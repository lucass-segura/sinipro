import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  features: Feature[]
}

export function ComingSoon({ icon: Icon, title, description, features }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-4">
      <div className="space-y-4">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Próximamente
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {features.map(({ icon: FIcon, title: fTitle, description: fDesc }) => (
          <div
            key={fTitle}
            className="rounded-xl border border-border bg-card p-4 text-left space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{fTitle}</p>
            </div>
            <p className="text-xs text-muted-foreground pl-9">{fDesc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
