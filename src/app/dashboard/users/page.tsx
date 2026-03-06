
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, Key, AlertCircle, Info } from "lucide-react"
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
      password: formData.get("password") as string,
      roleId: roleId,
      status: formData.get("status") as string || "Activo",
      updatedAt: new Date().toISOString()
    }

    if (editingUser) {
      updateDocumentNonBlocking(doc(db, "company_users", editingUser.id), userData)
      toast({ 
        title: "Perfil actualizado", 
        description: "Los datos del colaborador se han guardado en la base de datos." 
      })
    } else {
      const newUser = { ...userData, createdAt: new Date().toISOString() }
      addDocumentNonBlocking(usersRef, newUser)
      toast({ 
        title: "Perfil registrado con éxito", 
        description: "El perfil técnico ha sido creado. Recuerda habilitar sus credenciales en la consola de Auth." 
      })
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
          <h2 className="text-2xl font-bold tracking-tight mb-1 font-headline">COLABORADORES PERÚ</h2>
          <p className="text-muted-foreground text-sm">Administre el personal y asigne roles dinámicos del sistema.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveUser}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Colaborador" : "Nuevo Registro de Perfil"}</DialogTitle>
                <DialogDescription>Defina la identidad y permisos del colaborador en la base de datos.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-tight">
                    <strong>Nota de Sistema:</strong> Al guardar, se creará el perfil en Firestore (roles y permisos). Para habilitar el acceso al sistema, asegúrese de crear el usuario con el mismo correo en <strong>Firebase Console > Authentication</strong>.
                  </p>
                </div>

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
                  <Label htmlFor="name" className="text-xs uppercase font-bold">Nombre Completo</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required placeholder="Ej. Juan Pérez" className="h-9" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs uppercase font-bold">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required placeholder="juan@servifumiga.com" className="h-9" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" name="password" className="text-xs uppercase font-bold">Contraseña Provisional</Label>
                  <div className="relative">
                    <Input id="password" name="password" type="password" defaultValue={editingUser?.password} required placeholder="••••••••" className="h-9" />
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roleId" className="text-xs uppercase font-bold">Rol Asignado</Label>
                    <Select name="roleId" defaultValue={editingUser?.roleId} required>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs uppercase font-bold">Estado</Label>
                    <Select name="status" defaultValue={editingUser?.status || "Activo"}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!roles || roles.length === 0} className="w-full bg-primary text-white font-bold uppercase text-[11px]">
                  {editingUser ? "Actualizar Datos" : "Confirmar Alta de Perfil"}
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
              className="pl-9 h-9 text-xs" 
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
                  <TableHead className="text-white">Contacto / Login</TableHead>
                  <TableHead className="text-white">Rol Asignado</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-primary">{u.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium">{u.email}</span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">Login Habilitado: Sí</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold bg-blue-50 text-blue-600 border-blue-200">
                        {getRoleTitle(u.roleId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-bold",
                        u.status === "Activo" ? "border-status-success text-status-success bg-status-success/5" : "text-muted-foreground"
                      )}>
                        {u.status || "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(u)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-bold tracking-widest opacity-50">
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
