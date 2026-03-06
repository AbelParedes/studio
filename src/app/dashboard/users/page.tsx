
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, UserCog, ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react"
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
import Link from "next/link"

export default function UsersPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users, isLoading: loadingUsers } = useCollection(usersRef)

  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles, isLoading: loadingRoles } = useCollection(rolesRef)

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const roleId = formData.get("roleId") as string

    if (!roleId || roleId === "none") {
      toast({ variant: "destructive", title: "Error", description: "Debe seleccionar un rol válido." })
      return
    }

    const userData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      roleId: roleId,
      status: formData.get("status") as string || "Activo",
      updatedAt: new Date().toISOString()
    }

    if (editingUser) {
      updateDocumentNonBlocking(doc(db, "company_users", editingUser.id), userData)
      toast({ title: "Usuario actualizado", description: "Los cambios se han guardado exitosamente." })
    } else {
      const newUser = { ...userData, createdAt: new Date().toISOString() }
      addDocumentNonBlocking(usersRef, newUser)
      toast({ title: "Usuario registrado", description: "El colaborador ha sido dado de alta en el sistema." })
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

  const getRoleTitle = (roleId: string) => {
    const role = roles?.find(r => r.id === roleId)
    return role?.title || "Rol no encontrado"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">COLABORADORES PERÚ</h2>
          <p className="text-muted-foreground text-sm">Administre el personal y asigne roles dinámicos del sistema.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveUser}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Colaborador" : "Nuevo Registro"}</DialogTitle>
                <DialogDescription>Asigne uno de los roles creados en el módulo de Roles.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {roles?.length === 0 && !loadingRoles && (
                  <div className="bg-status-error/5 border border-status-error/20 p-3 rounded-md flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-status-error shrink-0 mt-0.5" />
                    <div className="text-[11px] text-status-error">
                      <p className="font-bold uppercase">No hay roles configurados</p>
                      <p>Para crear un usuario, primero debe definir al menos un rol.</p>
                      <Link href="/dashboard/roles" className="underline font-bold mt-1 block">Ir a Roles y Permisos</Link>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required placeholder="Ej. Juan Pérez" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required placeholder="juan@servifumiga.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="roleId">Rol Asignado</Label>
                  <Select name="roleId" defaultValue={editingUser?.roleId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.title}
                        </SelectItem>
                      ))}
                      {(!roles || roles.length === 0) && (
                        <SelectItem value="none" disabled>No hay roles disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={editingUser?.status || "Activo"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!roles || roles.length === 0}>
                  {editingUser ? "Actualizar" : "Confirmar Alta"}
                </Button>
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
              placeholder="Buscar colaborador..." 
              className="pl-9 h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers || loadingRoles ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Nombre</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Rol Asignado</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-bold">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-blue-50 text-blue-600 border-blue-200">
                        {getRoleTitle(u.roleId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-bold border-status-success/20",
                        u.status === "Activo" ? "text-status-success" : "text-muted-foreground"
                      )}>
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
                ))}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                      No hay colaboradores registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
