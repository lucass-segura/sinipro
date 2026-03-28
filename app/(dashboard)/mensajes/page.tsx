import { MessageSquare, Users, Bell, Search, Link } from "lucide-react"
import { ComingSoon } from "@/components/coming-soon"

export default function MensajesPage() {
  return (
    <div className="p-6 lg:p-8">
      <ComingSoon
        icon={MessageSquare}
        title="Mensajería Interna"
        description="Comunicación directa entre los miembros del equipo, vinculada a clientes, pólizas y siniestros para mantener todo en contexto."
        features={[
          {
            icon: Users,
            title: "Mensajes entre usuarios",
            description: "Comunicación privada entre miembros del equipo",
          },
          {
            icon: Link,
            title: "Mensajes contextuales",
            description: "Vinculá mensajes a un cliente, póliza o siniestro",
          },
          {
            icon: Bell,
            title: "Notificaciones",
            description: "Recibí alertas cuando te envíen un mensaje",
          },
          {
            icon: Search,
            title: "Búsqueda de mensajes",
            description: "Encontrá conversaciones anteriores fácilmente",
          },
        ]}
      />
    </div>
  )
}
