
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
  RefreshCw,
  Globe
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
  manage_saas: "Gestión SaaS (Maestro)",
  manage_users: "Gestión de Usuarios",
  manage_inventory: "Gestión de Inventario",
  view_reports: "Ver Reportes",
  manage_clients: "Gestión de Clientes",
  field_operations: "Operaciones de Campo"
}

const DEFAULT_ROLES = [
  {
    title: "Super Administrador",
    description: "Acceso total al sistema SaaS. Control de empresas, planes y seguridad global.",
    color: "text-accent",
    permissions: {
      manage_saas: true,
      manage_users: true,
      manage_inventory: true,
      view_reports: true,
      manage_clients: true,
      field_operations: true,
    }
  },
  {
    title: "Administrador",
    description: "Acceso total a su empresa específica, gestión de personal y finanzas.",
    color: "text-primary",
    permissions: {
      manage_saas: false,
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
      manage_saas: false,
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
      manage_saas: false,
      manage_users: false,
      manage_inventory: true,
      view_reports: true,
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
        manage_saas: (e.currentTarget.elements.namedItem("manage_saas") as HTMLInputElement).checked,
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
        const exists = roles?.find(r => r.title === role.title)
        if (!exists) {
          addDocumentNonBlocking(rolesRef, { ...role, id: crypto.randomUUID() })
        }
      }
      toast({ title: "Roles inicializados", description: "Se han cargado los roles predeterminados para el entorno SaaS." })
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
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Roles y Permisos SaaS</h2>
          <p className="text-muted-foreground text-sm">Configure la matriz de acceso para el personal de su empresa y del sistema.</p>
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
              Inicializar Roles Maestros
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
                  <DialogDescription>Defina el nombre y los privilegios del perfil.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Nombre del Rol</Label>
                    <Input id="title" name="title" defaultValue={editingRole?.title} required placeholder="Ej. Super Administrador" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" name="description" defaultValue={editingRole?.description} placeholder="Breve explicación de funciones" />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase text-primary flex items-center">
                      <Lock className="h-3 w-3 mr-2" /> Privilegios de Acceso
                    </h4>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors">
                          <Checkbox id={key} name={key} defaultChecked={editingRole?.permissions?.[key]} />
                          <Label htmlFor={key} className="text-sm font-medium leading-none cursor-pointer flex-1">
                            {label}
                            {key === 'manage_saas' && <Badge variant="outline" className="ml-2 text-[8px] bg-accent/10 text-accent border-accent/20">ROOT</Badge>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full uppercase font-bold text-xs">{editingRole ? "Guardar Cambios" : "Habilitar Perfil"}</Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles?.map((role) => (
            <Card key={role.id} className={cn(
              "shadow-sm border-none overflow-hidden group hover:shadow-md transition-all",
              role.title === "Super Administrador" && "border-t-4 border-t-accent bg-accent/5"
            )}>
              <CardHeader className="pb-4 bg-muted/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", role.color)}>
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center">
                        {role.title}
                        {role.permissions?.manage_saas && <Globe className="ml-2 h-3.5 w-3.5 text-accent" />}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground">ID: {role.id}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/80 text-primary font-bold">
                    <Users className="h-3 w-3 mr-1.5" />
                    {getUserCountByRole(role.id)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <p className="text-xs text-muted-foreground leading-relaxed h-12 overflow-hidden">
                  {role.description || "Sin descripción asignada."}
                </p>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                    <Lock className="h-3 w-3 mr-1.5" /> Matriz de Permisos
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(role.permissions || {}).map(([key, access]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-md bg-white border border-border/50">
                        <span className="text-[10px] font-bold uppercase text-slate-600">{PERMISSION_LABELS[key]}</span>
                        {access ? (
                          <CheckCircle2 className="h-4 w-4 text-status-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/20" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => openEdit(role)}>
                    <Edit3 className="h-3 w-3 mr-1.5" /> Editar
                  </Button>
                  {role.title !== "Super Administrador" && (
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)}>
                      <Trash2 className="h-3 w-3 mr-1.5" /> Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Seguridad Multi-Empresa Habilitada</h3>
              <p className="text-sm opacity-80">
                El rol de Super Administrador permite gestionar múltiples instancias SaaS desde un solo panel.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-3 py-1 rounded-full shadow-lg">
            Silo de Datos Aislado v3.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
