
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, BadgeCheck, ShieldAlert, ShieldCheck, UserCog, UserCircle } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
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
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users, isLoading } = useCollection(usersRef)

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const userData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      status: formData.get("status") as string || "Activo",
    }

    if (editingUser) {
      updateDocumentNonBlocking(doc(db, "company_users", editingUser.id), userData)
      toast({ title: "Usuario actualizado" })
    } else {
      const newUser = { ...userData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(usersRef, newUser)
      toast({ title: "Usuario registrado" })
    }

    setIsAdding(false)
    setEditingUser(null)
  }

  const handleDeleteUser = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "company_users", id))
    toast({ variant: "destructive", title: "Usuario eliminado" })
  }

  const openEdit = (user: any) => {
    setEditingUser(user)
    setIsAdding(true)
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
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveUser}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Registro de Usuario"}</DialogTitle>
                <DialogDescription>Asigne un rol específico para determinar los permisos de acceso.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required placeholder="Ej. Juan Pérez" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required placeholder="juan@servifumiga.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rol del Sistema</Label>
                  <Select name="role" defaultValue={editingUser?.role || "Technician"} required>
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
                <Button type="submit">{editingUser ? "Actualizar" : "Confirmar Registro"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, correo o rol..." 
              className="pl-9 h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  <TableHead className="text-white">Nombre</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Rol</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => {
                  const roleInfo = getRoleInfo(u.role)
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[9px] uppercase font-bold", roleInfo.color, roleInfo.bg)}>
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold text-status-success border-status-success/20">
                          {u.status || "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
