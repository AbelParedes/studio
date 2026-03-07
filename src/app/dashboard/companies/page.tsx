
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Building2, Trash2, Edit2, Loader2, LogIn, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from "@/firebase"
import { collection, doc, query, where, getDocs, updateDoc, limit, writeBatch } from "firebase/firestore"
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
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function CompaniesPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any | null>(null)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState<string | null>(null)

  // Verificación de Super Admin
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0]
  
  const roleRef = useMemoFirebase(() => profile?.roleId ? doc(db, "system_roles", profile.roleId) : null, [db, profile?.roleId])
  const { data: roleData, isLoading: loadingRole } = useDoc(roleRef)

  const companiesRef = useMemoFirebase(() => collection(db, "companies"), [db])
  const { data: companies, isLoading } = useCollection(companiesRef)

  useEffect(() => {
    if (!loadingProfile && !loadingRole && roleData && roleData.title !== "Administrador") {
      toast({ variant: "destructive", title: "Acceso denegado", description: "Solo el administrador maestro gestiona empresas." })
      router.push("/dashboard")
    }
  }, [roleData, loadingProfile, loadingRole, router])

  if (loadingProfile || loadingRole || !roleData) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const companyData = {
      name: formData.get("name") as string,
      taxId: formData.get("taxId") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      logoUrl: formData.get("logoUrl") as string,
      primaryColor: formData.get("primaryColor") as string || "#1a2b3c",
      accentColor: formData.get("accentColor") as string || "#d9534f",
      themeMode: formData.get("themeMode") as string || "light",
      status: formData.get("status") as string || "Active",
      updatedAt: new Date().toISOString()
    }

    if (editingCompany) {
      updateDocumentNonBlocking(doc(db, "companies", editingCompany.id), companyData)
      toast({ title: "Empresa actualizada" })
    } else {
      const newId = crypto.randomUUID()
      const newCompany = { ...companyData, id: newId, createdAt: new Date().toISOString() }
      addDocumentNonBlocking(companiesRef, newCompany)
      toast({ title: "Empresa creada" })
    }

    setIsAdding(false)
    setEditingCompany(null)
  }

  const handleApproveCompany = async (companyId: string) => {
    setIsApproving(companyId)
    try {
      // 1. Activar la empresa
      await updateDoc(doc(db, "companies", companyId), { status: "Active" })
      
      // 2. Activar a todos los usuarios vinculados a esa empresa
      const usersSnapshot = await getDocs(query(collection(db, "company_users"), where("companyId", "==", companyId)))
      const batch = writeBatch(db)
      usersSnapshot.docs.forEach(userDoc => {
        batch.update(userDoc.ref, { status: "Active" })
      })
      await batch.commit()

      toast({ title: "Organización Activada", description: "La empresa y sus usuarios ya pueden operar." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error al aprobar" })
    } finally {
      setIsApproving(null)
    }
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (!user?.email) return
    setIsSwitching(companyId)
    
    try {
      const snapshot = await getDocs(query(collection(db, "company_users"), where("email", "==", user.email)))
      if (!snapshot.empty) {
        await updateDoc(doc(db, "company_users", snapshot.docs[0].id), { companyId })
        toast({ title: "Accediendo a la organización..." })
        window.location.reload()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cambiar empresa" })
    } finally {
      setIsSwitching(null)
    }
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", id))
    toast({ variant: "destructive", title: "Empresa eliminada" })
  }

  const filteredCompanies = companies?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Maestro de Empresas</h2>
          <p className="text-muted-foreground text-sm">Panel de control SaaS para la gestión de organizaciones.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingCompany(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSaveCompany}>
              <DialogHeader>
                <DialogTitle>{editingCompany ? "Editar Organización" : "Nueva Organización"}</DialogTitle>
                <DialogDescription>Datos fiscales e identidad de la nueva empresa.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input id="name" name="name" defaultValue={editingCompany?.name} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">RUC / DNI</Label>
                    <Input id="taxId" name="taxId" defaultValue={editingCompany?.taxId} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado Inicial</Label>
                    <Select name="status" defaultValue={editingCompany?.status || "Active"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Activo</SelectItem>
                        <SelectItem value="Pending">Pendiente</SelectItem>
                        <SelectItem value="Suspended">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Admin</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingCompany?.email} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logoUrl">URL Logo</Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={editingCompany?.logoUrl} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingCompany ? "Actualizar" : "Crear Empresa"}</Button>
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
              placeholder="Buscar por nombre o RUC..." 
              className="pl-9 h-9 text-xs" 
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
                  <TableHead className="text-white">Organización</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white">Identidad</TableHead>
                  <TableHead className="text-white w-[250px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((comp) => (
                  <TableRow key={comp.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative bg-white border rounded overflow-hidden shadow-sm">
                          {comp.logoUrl ? (
                            <Image src={comp.logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary uppercase truncate max-w-[150px]">{comp.name}</span>
                          <span className="text-[10px] text-muted-foreground">{comp.taxId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] uppercase font-bold",
                          comp.status === "Active" && "border-status-success text-status-success",
                          comp.status === "Pending" && "border-status-warning text-status-warning bg-status-warning/5",
                          comp.status === "Suspended" && "border-status-error text-status-error",
                        )}
                      >
                        {comp.status === "Pending" && <Clock className="mr-1 h-3 w-3" />}
                        {comp.status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-4 rounded shadow-sm border" style={{ backgroundColor: comp.primaryColor }}></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {comp.status === "Pending" && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-status-success hover:bg-status-success/90 h-8 text-[10px] font-bold uppercase"
                            onClick={() => handleApproveCompany(comp.id)}
                            disabled={isApproving === comp.id}
                          >
                            {isApproving === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3 w-3" />}
                            Aprobar
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase"
                          onClick={() => handleSwitchCompany(comp.id)}
                          disabled={isSwitching === comp.id}
                        >
                          {isSwitching === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="mr-1.5 h-3 w-3" />}
                          Gestionar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(comp)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(comp.id)}>
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
