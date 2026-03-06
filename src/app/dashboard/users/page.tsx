"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, Key, AlertCircle, Sparkles, Info } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { initializeApp, deleteApp, getApps } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { firebaseConfig } from "@/firebase/config"
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

export default function UsersPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users, isLoading: loadingUsers } = useCollection(usersRef)

  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles, isLoading: loadingRoles } = useCollection(rolesRef)

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const roleId = formData.get("roleId") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (!roleId || roleId === "none") {
      toast({ variant: "destructive", title: "Error", description: "Debe seleccionar un rol válido." })
      return
    }

    setIsProcessingAuth(true)

    const userData = {
      name: name,
      email: email,
      roleId: roleId,
      status: formData.get("status") as string || "Activo",
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingUser) {
        updateDocumentNonBlocking(doc(db, "company_users", editingUser.id), userData)
        toast({ title: "Perfil actualizado", description: "Los datos del colaborador se han guardado." })
      } else {
        const newUser = { ...userData, createdAt: new Date().toISOString() }
        addDocumentNonBlocking(usersRef, newUser)

        // Creación automática en Auth usando instancia secundaria
        const secondaryAppName = `AuthCreator_${Date.now()}`
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
        const secondaryAuth = getAuth(secondaryApp)

        try {
          await createUserWithEmailAndPassword(secondaryAuth, email, password)
          await signOut(secondaryAuth)
          await deleteApp(secondaryApp)
          
          toast({ 
            title: "¡Usuario Creado!", 
            description: `El acceso para ${email} se ha habilitado automáticamente.` 
          })
        } catch (authErr: any) {
          console.error("Error Auth:", authErr)
          toast({ 
            variant: "destructive", 
            title: "Aviso de Registro", 
            description: "El perfil se guardó en la base de datos, pero el acceso debe habilitarse manualmente en la consola si el correo ya existe." 
          })
        }
      }

      setIsAdding(false)
      setEditingUser(null)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el registro." })
    } finally {
      setIsProcessingAuth(false)
    }
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
    return role?.title || "Sin Rol"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">COLABORADORES PERÚ</h2>
          <p className="text-muted-foreground text-sm">Gestión de personal con sincronización automática de accesos.</p>
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
                <DialogTitle>{editingUser ? "Editar Colaborador" : "Nuevo Registro"}</DialogTitle>
                <DialogDescription>Los datos se sincronizarán con el sistema de acceso automáticamente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-tight">
                    <strong>Sincronización Automática:</strong> Al guardar, el sistema crea el perfil en Firestore y las credenciales en Auth de forma simultánea. Para accesos manuales, use la Consola de Firebase &gt; Authentication.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs uppercase font-bold">Nombre Completo</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required placeholder="Ej. Abel Tomas Paredes Vasquez" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs uppercase font-bold">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required placeholder="ejemplo@servifumiga.com" />
                </div>
                {!editingUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="password" name="password" className="text-xs uppercase font-bold">Contraseña Inicial</Label>
                    <div className="relative">
                      <Input id="password" name="password" type="password" required placeholder="Mínimo 6 caracteres" />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roleId" className="text-xs uppercase font-bold">Rol</Label>
                    <Select name="roleId" defaultValue={editingUser?.roleId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs uppercase font-bold">Estado</Label>
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
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isProcessingAuth} 
                  className="w-full bg-primary text-white font-bold uppercase text-[11px]"
                >
                  {isProcessingAuth ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sincronizando...</>
                  ) : (
                    editingUser ? "Guardar Cambios" : "Crear y Habilitar Acceso"
                  )}
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
              placeholder="Buscar por nombre o email..." 
              className="pl-9 h-9 text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Colaborador</TableHead>
                  <TableHead className="text-white">Email / Login</TableHead>
                  <TableHead className="text-white">Cargo</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-bold text-primary uppercase">{u.name}</TableCell>
                    <TableCell className="text-[11px]">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold border-blue-200 text-blue-600">
                        {getRoleTitle(u.roleId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-bold",
                        u.status === "Activo" ? "border-status-success text-status-success" : "text-muted-foreground"
                      )}>
                        {u.status || "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
