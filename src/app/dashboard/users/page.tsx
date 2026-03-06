
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, BadgeCheck, ShieldAlert, ShieldCheck, UserCog, UserCircle } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const ROLES = [
  { value: "Administrator", label: "Administrador", icon: ShieldAlert, color: "text-status-error", bg: "bg-status-error/10", border: "border-status-error/20" },
  { value: "Technician", label: "Técnico de Campo", icon: UserCog, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { value: "Client", label: "Cliente", icon: UserCircle, color: "text-status-success", bg: "bg-status-success/10", border: "border-status-success/20" },
  { value: "Support", label: "Soporte Técnico", icon: ShieldCheck, color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/20" }
]

export default function UsersPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  // Data Fetching
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users, isLoading } = useCollection(usersRef)

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const id = crypto.randomUUID()

    const newUser = {
      name,
      email,
      role,
      status: "Activo",
      createdAt: new Date().toISOString(),
      id
    }

    const userDocRef = doc(db, "company_users", id)
    setDoc(userDocRef, newUser)
      .then(() => {
        setIsAdding(false)
        toast({ title: "Usuario registrado", description: `Perfil de ${name} creado con rol ${role}.` })
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo registrar al usuario." })
      })
  }

  const handleDeleteUser = (id: string) => {
    const docRef = doc(db, "company_users", id)
    deleteDocumentNonBlocking(docRef)
    toast({ variant: "destructive", title: "Usuario eliminado" })
  }

  const getRoleInfo = (roleName: string) => {
    return ROLES.find(r => r.value === roleName) || ROLES[1]
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">GESTIÓN DE USUARIOS Y ROLES</h2>
          <p className="text-muted-foreground text-sm">Controle el acceso al sistema y defina las responsabilidades de su equipo.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddUser}>
              <DialogHeader>
                <DialogTitle>Nuevo Registro de Usuario</DialogTitle>
                <DialogDescription>Asigne un rol específico para determinar los permisos de acceso.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" required placeholder="Ej. Juan Pérez" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" required placeholder="juan@servifumiga.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rol del Sistema</Label>
                  <Select name="role" defaultValue="Technician" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center">
                            <role.icon className={cn("mr-2 h-4 w-4", role.color)} />
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Confirmar Registro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {ROLES.map(role => (
          <Card key={role.value} className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", role.bg)}>
                  <role.icon className={cn("h-5 w-5", role.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{role.label}</p>
                  <p className="text-xl font-bold">{users?.filter(u => u.role === role.value).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, correo o rol..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Nombre / Identidad</TableHead>
                  <TableHead className="text-white">Contacto Principal</TableHead>
                  <TableHead className="text-white">Rol Asignado</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => {
                  const roleInfo = getRoleInfo(u.role)
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs", roleInfo.bg, roleInfo.color)}>
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold uppercase text-[11px]">{u.name}</div>
                            <div className="text-[9px] text-muted-foreground">ID: {u.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" /> {u.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase font-bold gap-1.5",
                          roleInfo.bg, roleInfo.color, roleInfo.border
                        )}>
                          <roleInfo.icon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase font-bold px-2",
                          u.status === "Activo" ? "border-status-success text-status-success bg-status-success/5" : "text-muted-foreground"
                        )}>
                          {u.status || "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!isLoading && filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No se encontraron usuarios registrados con los criterios de búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-primary/5 border-dashed border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <BadgeCheck className="h-10 w-10 text-primary opacity-50" />
          <div className="text-xs">
            <p className="font-bold text-primary uppercase mb-1">Control de Permisos y Accesos</p>
            <p className="text-muted-foreground leading-relaxed">
              El rol <span className="font-bold">Administrador</span> tiene control total. 
              Los <span className="font-bold">Técnicos</span> acceden solo a rutas de servicio. 
              Los <span className="font-bold">Clientes</span> pueden ver su inventario y certificados. 
              El equipo de <span className="font-bold">Soporte</span> gestiona incidencias técnicas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
