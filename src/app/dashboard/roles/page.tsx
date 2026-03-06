
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ShieldAlert, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Users,
  Lock,
  Edit3,
  Trash2,
  Loader2,
  Sparkles,
  RefreshCw
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

const PERMISSION_LABELS: Record<string, string> = {
  manage_users: "Gestión de Usuarios",
  manage_inventory: "Gestión de Inventario",
  view_reports: "Ver Reportes",
  manage_clients: "Gestión de Clientes",
  field_operations: "Operaciones de Campo"
}

const DEFAULT_ROLES = [
  {
    title: "Administrador",
    description: "Acceso total al sistema, gestión de personal y finanzas.",
    color: "text-red-600",
    permissions: {
      manage_users: true,
      manage_inventory: true,
      view_reports: true,
      manage_clients: true,
      field_operations: true,
    }
  },
  {
    title: "Técnico de Campo",
    description: "Acceso a rutas, inventario de equipos y reportes técnicos.",
    color: "text-blue-600",
    permissions: {
      manage_users: false,
      manage_inventory: true,
      view_reports: false,
      manage_clients: true,
      field_operations: true,
    }
  },
  {
    title: "Coordinador de Servicios",
    description: "Gestión de clientes, programación de calendario y reportes.",
    color: "text-green-600",
    permissions: {
      manage_users: false,
      manage_inventory: true,
      view_reports: true,
      manage_clients: true,
      field_operations: false,
    }
  },
  {
    title: "Soporte / Ventas",
    description: "Atención al cliente y visualización de historial de servicios.",
    color: "text-orange-600",
    permissions: {
      manage_users: false,
      manage_inventory: false,
      view_reports: false,
      manage_clients: true,
      field_operations: false,
    }
  }
]

export default function RolesPage() {
  const db = useFirestore()
  const [isAdding, setIsAdding] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)

  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles, isLoading } = useCollection(rolesRef)

  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users } = useCollection(usersRef)

  const handleSaveRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const roleData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string || "text-blue-600",
      permissions: {
        manage_users: (e.currentTarget.elements.namedItem("manage_users") as HTMLInputElement).checked,
        manage_inventory: (e.currentTarget.elements.namedItem("manage_inventory") as HTMLInputElement).checked,
        view_reports: (e.currentTarget.elements.namedItem("view_reports") as HTMLInputElement).checked,
        manage_clients: (e.currentTarget.elements.namedItem("manage_clients") as HTMLInputElement).checked,
        field_operations: (e.currentTarget.elements.namedItem("field_operations") as HTMLInputElement).checked,
      }
    }

    if (editingRole) {
      updateDocumentNonBlocking(doc(db, "system_roles", editingRole.id), roleData)
      toast({ title: "Rol actualizado", description: `El rol ${roleData.title} ha sido modificado.` })
    } else {
      const newRole = { ...roleData, id: crypto.randomUUID() }
      addDocumentNonBlocking(rolesRef, newRole)
      toast({ title: "Rol creado", description: `El rol ${roleData.title} ya está disponible.` })
    }

    setIsAdding(false)
    setEditingRole(null)
  }

  const handleInitializeDefaults = async () => {
    setIsInitializing(true)
    try {
      for (const role of DEFAULT_ROLES) {
        // Verificar si el rol ya existe por título para evitar duplicados
        const exists = roles?.find(r => r.title === role.title)
        if (!exists) {
          addDocumentNonBlocking(rolesRef, { ...role, id: crypto.randomUUID() })
        }
      }
      toast({ title: "Roles inicializados", description: "Se han cargado los roles predeterminados para Perú." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los roles." })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleDeleteRole = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "system_roles", id))
    toast({ variant: "destructive", title: "Rol eliminado" })
  }

  const openEdit = (role: any) => {
    setEditingRole(role)
    setIsAdding(true)
  }

  const getUserCountByRole = (roleId: string) => {
    return users?.filter(u => u.roleId === roleId).length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">ROLES Y PERMISOS PERÚ</h2>
          <p className="text-muted-foreground text-sm">Configure la matriz de acceso para cada perfil operativo.</p>
        </div>
        
        <div className="flex gap-2">
          {(!roles || roles.length === 0) && !isLoading && (
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent/5 h-9 font-bold text-[11px] uppercase"
              onClick={handleInitializeDefaults}
              disabled={isInitializing}
            >
              {isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Cargar Roles Predeterminados
            </Button>
          )}
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingRole(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white h-9">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSaveRole}>
                <DialogHeader>
                  <DialogTitle>{editingRole ? "Editar Rol" : "Crear Nuevo Rol"}</DialogTitle>
                  <DialogDescription>Defina el nombre y los permisos de acceso al sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Nombre del Rol</Label>
                    <Input id="title" name="title" defaultValue={editingRole?.title} required placeholder="Ej. Supervisor de Campo" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" name="description" defaultValue={editingRole?.description} placeholder="Breve explicación de funciones" />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase text-primary flex items-center">
                      <Lock className="h-3 w-3 mr-2" /> Permisos Disponibles
                    </h4>
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox id={key} name={key} defaultChecked={editingRole?.permissions?.[key]} />
                        <Label htmlFor={key} className="text-sm font-medium leading-none cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">
                    {editingRole ? "Guardar Cambios" : "Crear Perfil de Acceso"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles?.map((role) => (
            <Card key={role.id} className="shadow-sm border-none overflow-hidden group hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", role.color)}>
                      <ShieldCheck className="h-6 w-6" />
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
                  {role.description || "Sin descripción asignada."}
                </p>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    <Lock className="h-3 w-3 mr-1.5" /> Permisos Activos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(role.permissions || {}).map(([key, access]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50">
                        <span className="text-[11px] font-medium">{PERMISSION_LABELS[key]}</span>
                        {access ? (
                          <CheckCircle2 className="h-4 w-4 text-status-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => openEdit(role)}>
                    <Edit3 className="h-3 w-3 mr-1.5" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)}>
                    <Trash2 className="h-3 w-3 mr-1.5" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!roles || roles.length === 0) && (
            <Card className="md:col-span-2 border-dashed border-2 py-20 flex flex-col items-center justify-center text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest">No hay roles definidos</p>
              <p className="text-xs mt-2 mb-6">Inicie el sistema cargando los roles sugeridos o cree uno nuevo.</p>
              <div className="flex gap-4">
                <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                  {isInitializing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cargar Roles Predeterminados
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(true)}>Crear Rol Manualmente</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Control de Acceso Dinámico</h3>
              <p className="text-sm opacity-80">
                Los cambios en los roles se aplican instantáneamente a todos los usuarios asignados.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-3 py-1 rounded-full">
            Matriz de Seguridad Pro v2.5
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
