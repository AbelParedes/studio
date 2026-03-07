
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Building2, Trash2, Edit2, Loader2, LogIn, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react"
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

  // Verificación de Super Admin (solo Administrador Maestro puede ver esto)
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0]
  
  const roleRef = useMemoFirebase(() => profile?.roleId ? doc(db, "system_roles", profile.roleId) : null, [db, profile?.roleId])
  const { data: roleData, isLoading: loadingRole } = useDoc(roleRef)

  // Cargar todas las empresas del sistema
  const companiesRef = useMemoFirebase(() => collection(db, "companies"), [db])
  const { data: companies, isLoading } = useCollection(companiesRef)

  // Redirigir si no es administrador (Seguridad de Ruta)
  useEffect(() => {
    if (!loadingProfile && !loadingRole && roleData && roleData.title !== "Administrador") {
      toast({ variant: "destructive", title: "Acceso denegado", description: "Módulo exclusivo para Administrador Maestro." })
      router.push("/dashboard")
    }
  }, [roleData, loadingProfile, loadingRole, router])

  if (loadingProfile || loadingRole || !roleData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Validando Credenciales Maestro...</p>
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
      toast({ title: "Empresa creada exitosamente" })
    }

    setIsAdding(false)
    setEditingCompany(null)
  }

  const handleApproveCompany = async (companyId: string) => {
    setIsApproving(companyId)
    try {
      const batch = writeBatch(db)
      
      // 1. Activar la empresa
      batch.update(doc(db, "companies", companyId), { status: "Active" })
      
      // 2. Activar a todos los usuarios vinculados a esa empresa
      const usersSnapshot = await getDocs(query(collection(db, "company_users"), where("companyId", "==", companyId)))
      usersSnapshot.docs.forEach(userDoc => {
        batch.update(userDoc.ref, { status: "Active" })
      })
      
      await batch.commit()
      toast({ title: "Organización Activada", description: "La empresa y sus usuarios ya pueden operar." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error al aprobar", description: "No se pudo completar la activación." })
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
        toast({ title: "Cambiando de contexto...", description: "Ahora gestionas esta organización." })
        // Recarga forzada para aplicar nuevos estilos y datos
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cambiar empresa" })
    } finally {
      setIsSwitching(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta organización? Todos los datos asociados se verán inaccesibles.")) {
      deleteDocumentNonBlocking(doc(db, "companies", id))
      toast({ variant: "destructive", title: "Empresa eliminada" })
    }
  }

  const filteredCompanies = companies?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Centro de Mando SaaS</h2>
          <p className="text-muted-foreground text-sm font-medium">Gestión global de organizaciones y flujo de activaciones.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingCompany(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSaveCompany}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {editingCompany ? "Editar Organización" : "Registrar Nueva Organización"}
                </DialogTitle>
                <DialogDescription>Configure los datos fiscales y la identidad visual de la empresa cliente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase">Nombre Comercial</Label>
                    <Input id="name" name="name" defaultValue={editingCompany?.name} required placeholder="Ej. Corporación Perú SAC" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId" className="text-xs font-bold uppercase">RUC / DNI</Label>
                    <Input id="taxId" name="taxId" defaultValue={editingCompany?.taxId} required placeholder="Número de identidad fiscal" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs font-bold uppercase">Estado Operativo</Label>
                    <Select name="status" defaultValue={editingCompany?.status || "Active"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Activo</SelectItem>
                        <SelectItem value="Pending">Pendiente de Aprobación</SelectItem>
                        <SelectItem value="Suspended">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase">Email Administrador</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingCompany?.email} required placeholder="admin@empresa.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logoUrl" className="text-xs font-bold uppercase">URL del Logotipo</Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={editingCompany?.logoUrl} placeholder="https://dominio.com/logo.png" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primaryColor" className="text-xs font-bold uppercase">Color Primario (Hex)</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" name="primaryColor" defaultValue={editingCompany?.primaryColor || "#1a2b3c"} className="font-mono" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="themeMode" className="text-xs font-bold uppercase">Modo de Interfaz</Label>
                    <Select name="themeMode" defaultValue={editingCompany?.themeMode || "light"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro (Light)</SelectItem>
                        <SelectItem value="dark">Oscuro (Dark)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs tracking-widest">{editingCompany ? "Actualizar Organización" : "Crear e Inicializar SaaS"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, RUC o email..." 
              className="pl-9 h-9 text-xs border-muted shadow-inner" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Organización</TableHead>
                  <TableHead className="text-white">Estado SaaS</TableHead>
                  <TableHead className="text-white">Identidad</TableHead>
                  <TableHead className="text-white text-right w-[300px] pr-6">Acciones Maestras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((comp) => (
                  <TableRow key={comp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 relative bg-white border rounded shadow-sm flex items-center justify-center overflow-hidden">
                          {comp.logoUrl ? (
                            <Image src={comp.logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary uppercase text-[11px] truncate max-w-[180px]">{comp.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{comp.taxId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] uppercase font-bold px-2 py-0.5",
                          comp.status === "Active" && "border-status-success text-status-success bg-status-success/5",
                          comp.status === "Pending" && "border-status-warning text-status-warning bg-status-warning/5 animate-pulse",
                          comp.status === "Suspended" && "border-status-error text-status-error bg-status-error/5",
                        )}
                      >
                        {comp.status === "Pending" ? <Clock className="mr-1.5 h-3 w-3" /> : comp.status === "Suspended" ? <XCircle className="mr-1.5 h-3 w-3" /> : <CheckCircle2 className="mr-1.5 h-3 w-3" />}
                        {comp.status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full shadow-inner border" style={{ backgroundColor: comp.primaryColor }}></div>
                        <span className="text-[10px] font-mono text-muted-foreground">{comp.primaryColor}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {comp.status === "Pending" && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-status-success hover:bg-status-success/90 h-8 text-[10px] font-bold uppercase"
                            onClick={() => handleApproveCompany(comp.id)}
                            disabled={isApproving === comp.id}
                          >
                            {isApproving === comp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                            Aprobar
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase shadow-sm border border-border"
                          onClick={() => handleSwitchCompany(comp.id)}
                          disabled={isSwitching === comp.id}
                        >
                          {isSwitching === comp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                          Gestionar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(comp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive text-muted-foreground" onClick={() => handleDelete(comp.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-24 text-muted-foreground font-bold uppercase text-xs">
                      No se encontraron organizaciones registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Arquitectura Multi-Empresa Segura</h3>
              <p className="text-sm opacity-80 font-medium">
                Cada organización creada opera en su propio silo de datos aislado.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-4 py-1.5 rounded-full shadow-md">
            SaaS Master Controller v2.8
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
