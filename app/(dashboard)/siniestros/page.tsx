import { ShieldAlert, ClipboardList, Activity, FolderOpen, MessageSquare } from "lucide-react"
import { ComingSoon } from "@/components/coming-soon"

export default function SiniestrosPage() {
  return (
    <div className="p-6 lg:p-8">
      <ComingSoon
        icon={ShieldAlert}
        title="Seguimiento de Siniestros"
        description="Podrás registrar y hacer seguimiento completo de siniestros, adjuntar documentación, gestionar estados y comunicarte con las aseguradoras desde un único lugar."
        features={[
          {
            icon: ClipboardList,
            title: "Registro de Siniestros",
            description: "Cargá nuevos siniestros con todos los datos necesarios",
          },
          {
            icon: Activity,
            title: "Seguimiento de Estado",
            description: "Monitoreá el avance de cada siniestro en tiempo real",
          },
          {
            icon: FolderOpen,
            title: "Gestión de Documentos",
            description: "Adjuntá fotos, informes y documentos al expediente",
          },
          {
            icon: MessageSquare,
            title: "Comunicación Directa",
            description: "Coordiná con aseguradoras y clientes desde el sistema",
          },
        ]}
      />
    </div>
  )
}
