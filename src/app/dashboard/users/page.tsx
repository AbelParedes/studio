
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, Key, Building2, Info } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
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
  const { user: currentUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  // Perfil del admin para saber su empresa actual
  const adminProfileQuery = useMemoFirebase(() => 
    currentUser?.email ? query(collection(db, "company_users"), where("email", "==", currentUser.email)) : null,
  [db, currentUser?.email])
  const { data: adminProfiles } = useCollection(adminProfileQuery)
  const adminProfile = adminProfiles?.[0]
  const currentCompanyId = adminProfile?.companyId

  // Obtener rol del usuario actual para verificar si es Super Admin
  const currentRoleRef = useMemoFirebase(() => 
    adminProfile?.roleId ? doc(db, "system_roles", adminProfile.roleId) : null,
  [db, adminProfile?.roleId])
  const { data: currentRoleData } = useDoc(currentRoleRef)
  
  const isSuperAdmin = currentRoleData?.title === "Super Administrador" || currentRoleData?.permissions?.manage_saas === true

  // Listado de empresas (solo relevante para Super Admin)
  const companiesRef = useMemoFirebase(() => collection(db, "companies"), [db])
  const { data: companies } = useCollection(companiesRef)

  // Filtrar usuarios: Super Admin ve todos, Admin normal solo los de su empresa
  const usersRef = useMemoFirebase(() => {
    if (!currentCompanyId) return null
    return isSuperAdmin 
      ? collection(db, "company_users")
      : query(collection(db, "company_users"), where("companyId", "==", currentCompanyId))
  }, [db, currentCompanyId, isSuperAdmin])
  const { data: users, isLoading: loadingUsers } = useCollection(usersRef)

  // Listado de roles disponibles
  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles } = useCollection(rolesRef)

  // Filtrar roles: No permitir asignar Super Administrador si no se es uno
  const availableRoles = roles?.filter(r => isSuperAdmin || r.title !== "Super Administrador")

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
    const targetCompanyId = isSuperAdmin ? (formData.get("companyId") as string) : currentCompanyId

    if (!roleId || roleId === "none") {
      toast({ variant: "destructive", title: "Error", description: "Debe seleccionar un rol válido." })
      return
    }

    setIsProcessingAuth(true)

    const userData = {
      name: name,
      email: email,
      roleId: roleId,
      companyId: targetCompanyId,
      status: formData.get("status") as string || "Activo",
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingUser) {
        updateDocumentNonBlocking(doc(db, "company_users", editingUser.id), userData)
        toast({ title: "Perfil actualizado" })
      } else {
        const newUser = { ...userData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
        addDocumentNonBlocking(collection(db, "company_users"), newUser)

        // Creación de cuenta Auth mediante aplicación secundaria para no desloguear al admin actual
        const secondaryAppName = `AuthCreator_${Date.now()}`
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
        const secondaryAuth = getAuth(secondaryApp)

        try {
          await createUserWithEmailAndPassword(secondaryAuth, email, password)
          await signOut(secondaryAuth)
          await deleteApp(secondaryApp)
          toast({ title: "¡Usuario Creado!", description: `Acceso habilitado para ${email}.` })
        } catch (authErr: any) {
          toast({ variant: "destructive", title: "Aviso de Registro", description: "Perfil guardado, pero el acceso Auth debe revisarse." })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">COLABORADORES</h2>
          <p className="text-muted-foreground text-sm">
            {isSuperAdmin 
              ? "Gestión global de personal en todas las instancias SaaS." 
              : "Gestione los técnicos y administradores de su organización."}
          </p>
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
                <DialogDescription>
                  {isSuperAdmin 
                    ? "Asigne una empresa y credenciales de acceso maestro." 
                    : `El usuario será vinculado automáticamente a ${companies?.find(c => c.id === currentCompanyId)?.name || 'su empresa'}.`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                
                {isSuperAdmin && (
                  <div className="grid gap-2">
                    <Label htmlFor="companyId" className="text-xs uppercase font-bold text-accent">Empresa (Solo Super Admin)</Label>
                    <Select name="companyId" defaultValue={editingUser?.companyId || currentCompanyId} required>
                      <SelectTrigger className="border-accent/30">
                        <SelectValue placeholder="Seleccione Empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs uppercase font-bold">Nombre Completo</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs uppercase font-bold">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required />
                </div>
                {!editingUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="password" name="password" className="text-xs uppercase font-bold">Contraseña Inicial</Label>
                    <Input id="password" name="password" type="password" required placeholder="Mínimo 6 caracteres" />
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
                        {availableRoles?.map(role => (
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
                  {isProcessingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Colaborador"}
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
                  <TableHead className="text-white">Nombre</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Empresa</TableHead>
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
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">
                        {companies?.find(c => c.id === u.companyId)?.name || "Sin Empresa"}
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
