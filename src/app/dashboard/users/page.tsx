"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Search, Shield, Mail, Trash2, Edit2, Loader2, BadgeCheck } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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

export default function UsersPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  // Data Fetching
  const usersRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: users, isLoading } = useCollection(usersRef)

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const id = crypto.randomUUID() // En un entorno real esto vendría de Auth

    const newUser = {
      name,
      email,
      role,
      status: "Activo",
      createdAt: new Date().toISOString(),
      id
    }

    // Usamos setDoc para company_users porque solemos usar el UID como ID del documento
    const userDocRef = doc(db, "company_users", id)
    setDoc(userDocRef, newUser)
      .then(() => {
        setIsAdding(false)
        toast({ title: "Usuario registrado", description: `Se ha creado el perfil para ${name}.` })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">GESTIÓN DE USUARIOS</h2>
          <p className="text-muted-foreground text-sm">Administre el personal interno, sus roles y permisos de acceso.</p>
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
                <DialogTitle>Registrar Nuevo Empleado</DialogTitle>
                <DialogDescription>Asigne un nombre, correo y rol dentro de la empresa.</DialogDescription>
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
                  <Label htmlFor="role">Rol / Cargo</Label>
                  <Select name="role" defaultValue="Technician" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrador</SelectItem>
                      <SelectItem value="Coordinator">Coordinador de Operaciones</SelectItem>
                      <SelectItem value="Technician">Técnico de Campo</SelectItem>
                      <SelectItem value="Sales">Ejecutivo de Ventas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Crear Usuario</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o cargo..." 
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
                  <TableHead className="text-white">Nombre / Cargo</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold uppercase text-[11px]">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center">
                            <Shield className="h-2.5 w-2.5 mr-1" /> {u.role}
                          </div>
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
                ))}
                {!isLoading && filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                      No se encontraron usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-center gap-4">
          <BadgeCheck className="h-10 w-10 text-primary opacity-50" />
          <div className="text-xs">
            <p className="font-bold text-primary uppercase mb-1">Nota de Seguridad</p>
            <p className="text-muted-foreground">
              Los cambios en esta sección afectan los privilegios de acceso al sistema. Asegúrese de asignar los roles correspondientes a la jerarquía operativa de la empresa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
