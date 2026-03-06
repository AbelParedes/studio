"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldAlert, 
  UserCog, 
  UserCircle, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Users,
  Lock,
  Eye,
  Edit3
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { cn } from "@/lib/utils"

const ROLE_DEFINITIONS = [
  {
    id: "Administrator",
    title: "Administrador",
    icon: ShieldAlert,
    color: "text-status-error",
    bg: "bg-status-error/10",
    description: "Control total del sistema, gestión financiera y configuración global.",
    permissions: [
      { name: "Gestión de Usuarios", access: true },
      { name: "Configuración de Sistema", access: true },
      { name: "Reportes Financieros", access: true },
      { name: "Borrado de Datos", access: true },
      { name: "Gestión de Inventario", access: true },
    ]
  },
  {
    id: "Technician",
    title: "Técnico de Campo",
    icon: UserCog,
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Operativa de servicios, inspecciones y actualización de inventario técnico.",
    permissions: [
      { name: "Registro de Servicios", access: true },
      { name: "Actualizar Inventario", access: true },
      { name: "Ver Calendario", access: true },
      { name: "Gestión de Clientes", access: false },
      { name: "Configuración Global", access: false },
    ]
  },
  {
    id: "Support",
    title: "Soporte Técnico",
    icon: ShieldCheck,
    color: "text-status-warning",
    bg: "bg-status-warning/10",
    description: "Atención al cliente, agendamiento y soporte operativo básico.",
    permissions: [
      { name: "Ver Clientes", access: true },
      { name: "Agendar Citas", access: true },
      { name: "Ver Historial", access: true },
      { name: "Editar Usuarios", access: false },
      { name: "Reportes Críticos", access: false },
    ]
  },
  {
    id: "Client",
    title: "Cliente",
    icon: UserCircle,
    color: "text-status-success",
    bg: "bg-status-success/10",
    description: "Acceso limitado a su propio historial, certificados y reportes de servicio.",
    permissions: [
      { name: "Ver Mi Historial", access: true },
      { name: "Descargar Certificados", access: true },
      { name: "Ver Mis Equipos", access: true },
      { name: "Acceso a Inventario Global", access: false },
      { name: "Panel Administrativo", access: false },
    ]
  }
]

export default function RolesPage() {
  const db = useFirestore()
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users } = useCollection(usersRef)

  const getUserCountByRole = (roleId: string) => {
    return users?.filter(u => u.role === roleId).length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">ROLES Y PERMISOS</h2>
          <p className="text-muted-foreground text-sm">Definición de capacidades operativas y control de acceso por perfil.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROLE_DEFINITIONS.map((role) => (
          <Card key={role.id} className="shadow-sm border-none overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className={cn("pb-4", role.bg)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-white shadow-sm", role.color)}>
                    <role.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-tight">{role.title}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground">ID: {role.id}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/80 text-primary font-bold">
                  <Users className="h-3 w-3 mr-1.5" />
                  {getUserCountByRole(role.id)} Usuarios
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {role.description}
              </p>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                  <Lock className="h-3 w-3 mr-1.5" /> Matriz de Permisos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {role.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50">
                      <span className="text-[11px] font-medium">{perm.name}</span>
                      {perm.access ? (
                        <CheckCircle2 className="h-4 w-4 text-status-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold py-1 cursor-pointer hover:bg-muted">
                  <Eye className="h-3 w-3 mr-1.5" /> Ver Usuarios
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase font-bold py-1 cursor-pointer hover:bg-muted">
                  <Edit3 className="h-3 w-3 mr-1.5" /> Editar Permisos
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Seguridad de Acceso</h3>
              <p className="text-sm opacity-80">
                Los permisos se aplican automáticamente a cada usuario según su rol asignado.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-3 py-1 rounded-full">
            Matriz de Seguridad v2.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
