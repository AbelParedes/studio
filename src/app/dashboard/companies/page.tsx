
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Building2, 
  Trash2, 
  Edit2, 
  Loader2, 
  LogIn, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  CreditCard,
  Ban,
  Activity,
  Check
} from "lucide-react"
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
  const [isStatusChanging, setIsStatusChanging] = useState<string | null>(null)

  // Verificación de Super Admin
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0]
  
  const roleRef = useMemoFirebase(() => profile?.roleId ? doc(db, "system_roles", profile.roleId) : null, [db, profile?.roleId])
  const { data: roleData, isLoading: loadingRole } = useDoc(roleRef)

  // Cargar todas las empresas
  const companiesRef = useMemoFirebase(() => collection(db, "companies"), [db])
  const { data: companies, isLoading } = useCollection(companiesRef)

  useEffect(() => {
    if (!loadingProfile && !loadingRole && roleData && roleData.title !== "Administrador") {
      toast({ variant: "destructive", title: "Acceso denegado" })
      router.push("/dashboard")
    }
  }, [roleData, loadingProfile, loadingRole, router])

  if (loadingProfile || loadingRole || !roleData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cargando Centro de Mando...</p>
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
      plan: formData.get("plan") as string || "Básico",
      status: formData.get("status") as string || "Active",
      logoUrl: formData.get("logoUrl") as string,
      primaryColor: formData.get("primaryColor") as string || "#1a2b3c",
      accentColor: formData.get("accentColor") as string || "#d9534f",
      updatedAt: new Date().toISOString()
    }

    if (editingCompany) {
      updateDocumentNonBlocking(doc(db, "companies", editingCompany.id), companyData)
      toast({ title: "Organización actualizada" })
    } else {
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(companiesRef, { ...companyData, id: newId, createdAt: new Date().toISOString() })
      toast({ title: "Empresa SaaS creada" })
    }

    setIsAdding(false)
    setEditingCompany(null)
  }

  const toggleStatus = async (companyId: string, currentStatus: string) => {
    setIsStatusChanging(companyId)
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active"
    try {
      await updateDoc(doc(db, "companies", companyId), { status: newStatus })
      toast({ 
        title: newStatus === "Suspended" ? "Servicio Suspendido" : "Servicio Activado",
        description: `La empresa ${newStatus === "Suspended" ? "ya no tiene acceso" : "ya puede operar"}.`
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cambiar estado" })
    } finally {
      setIsStatusChanging(null)
    }
  }

  const handleApproveCompany = async (companyId: string) => {
    setIsStatusChanging(companyId)
    try {
      const batch = writeBatch(db)
      
      // 1. Activar Empresa
      batch.update(doc(db, "companies", companyId), { status: "Active" })
      
      // 2. Activar todos los usuarios de esa empresa
      const usersSnapshot = await getDocs(query(collection(db, "company_users"), where("companyId", "==", companyId)))
      usersSnapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, { status: "Active" })
      })

      await batch.commit()
      toast({ title: "Organización Aprobada", description: "La empresa y sus usuarios ya pueden acceder." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error al aprobar" })
    } finally {
      setIsStatusChanging(null)
    }
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (!user?.email) return
    setIsSwitching(companyId)
    try {
      const snapshot = await getDocs(query(collection(db, "company_users"), where("email", "==", user.email)))
      if (!snapshot.empty) {
        await updateDoc(doc(db, "company_users", snapshot.docs[0].id), { companyId })
        toast({ title: "Cambiando de contexto..." })
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de gestión" })
    } finally {
      setIsSwitching(null)
    }
  }

  const openEdit = (comp: any) => {
    setEditingCompany(comp)
    setIsAdding(true)
  }

  const filteredCompanies = companies?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Suscripciones y Planes SaaS</h2>
          <p className="text-muted-foreground text-sm">Controle el acceso, planes de facturación y estados de sus clientes.</p>
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
                <DialogTitle>Configuración de Organización</DialogTitle>
                <DialogDescription>Asigne planes y estados operativos.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase">Nombre</Label>
                    <Input id="name" name="name" defaultValue={editingCompany?.name} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId" className="text-xs font-bold uppercase">RUC / DNI</Label>
                    <Input id="taxId" name="taxId" defaultValue={editingCompany?.taxId} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan" className="text-xs font-bold uppercase">Plan de Suscripción</Label>
                    <Select name="plan" defaultValue={editingCompany?.plan || "Básico"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Básico">Plan Básico</SelectItem>
                        <SelectItem value="Profesional">Plan Profesional</SelectItem>
                        <SelectItem value="Empresarial">Plan Empresarial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs font-bold uppercase">Estado Inicial</Label>
                    <Select name="status" defaultValue={editingCompany?.status || "Active"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Activo</SelectItem>
                        <SelectItem value="Pending">Pendiente</SelectItem>
                        <SelectItem value="Suspended">Suspendido (Mora)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase">Email Admin</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCompany?.email} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingCompany ? "Actualizar" : "Crear Empresa SaaS"}</Button>
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
              placeholder="Buscar por nombre o RUC..." 
              className="pl-9 h-9 text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="dense-table">
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="text-white">Empresa</TableHead>
                <TableHead className="text-white">Plan</TableHead>
                <TableHead className="text-white">Estado</TableHead>
                <TableHead className="text-white text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies?.map((comp) => (
                <TableRow key={comp.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 relative bg-white border rounded flex items-center justify-center">
                        {comp.logoUrl ? (
                          <Image src={comp.logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary uppercase text-[11px]">{comp.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{comp.taxId}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase border-blue-200 text-blue-700 bg-blue-50">
                      <CreditCard className="mr-1 h-2.5 w-2.5" />
                      {comp.plan || "Básico"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] uppercase font-bold px-2 py-0.5",
                        comp.status === "Active" && "border-status-success text-status-success bg-status-success/5",
                        comp.status === "Pending" && "border-status-warning text-status-warning bg-status-warning/5",
                        comp.status === "Suspended" && "border-status-error text-status-error bg-status-error/5 animate-pulse",
                      )}
                    >
                      {comp.status === "Suspended" ? <Ban className="mr-1 h-3 w-3" /> : comp.status === "Pending" ? <Clock className="mr-1 h-3 w-3" /> : <Activity className="mr-1 h-3 w-3" />}
                      {comp.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {comp.status === "Pending" && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-7 text-[9px] font-bold uppercase bg-status-success text-white hover:bg-status-success/90"
                          onClick={() => handleApproveCompany(comp.id)}
                          disabled={isStatusChanging === comp.id}
                        >
                          {isStatusChanging === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                          Aprobar
                        </Button>
                      )}
                      
                      {comp.status !== "Pending" && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className={cn(
                            "h-7 text-[9px] font-bold uppercase",
                            comp.status === "Active" ? "hover:bg-status-error/10 hover:text-status-error" : "hover:bg-status-success/10 hover:text-status-success"
                          )}
                          onClick={() => toggleStatus(comp.id, comp.status)}
                          disabled={isStatusChanging === comp.id}
                        >
                          {isStatusChanging === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : comp.status === "Active" ? "Suspender" : "Activar"}
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[9px] font-bold uppercase"
                        onClick={() => handleSwitchCompany(comp.id)}
                        disabled={isSwitching === comp.id}
                      >
                        {isSwitching === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="mr-1 h-3.5 w-3.5" />}
                        Gestionar
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(comp)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
