import { FolderOpen, Upload, Search, Shield, Users } from "lucide-react"
import { ComingSoon } from "@/components/coming-soon"

export default function ArchivosPage() {
  return (
    <div className="p-6 lg:p-8">
      <ComingSoon
        icon={FolderOpen}
        title="Gestión de Archivos"
        description="Centralizá toda la documentación del negocio: pólizas, documentos de identidad, informes de siniestros y más, organizados por cliente y póliza."
        features={[
          {
            icon: Upload,
            title: "Carga de Documentos",
            description: "Subí PDFs, imágenes y documentos de cualquier tipo",
          },
          {
            icon: Search,
            title: "Búsqueda Inteligente",
            description: "Encontrá cualquier archivo por cliente, póliza o tipo",
          },
          {
            icon: Shield,
            title: "Almacenamiento Seguro",
            description: "Tus archivos protegidos con encriptación en Supabase Storage",
          },
          {
            icon: Users,
            title: "Acceso por Rol",
            description: "Controlá quién puede ver y editar cada documento",
          },
        ]}
      />
    </div>
  )
}
