"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wrench, 
  Search, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  PenTool, 
  CheckCircle2, 
  XCircle,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Save,
  UserPlus,
  Key,
  Shield,
  Briefcase
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { initializeApp, deleteApp } from "firebase/app"
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

export default function TechniciansPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingTech, setEditingTech] = useState<any | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles } = useCollection(rolesRef)
  
  const technicalRoles = useMemo(() => roles?.filter(r => 
    r.title.toLowerCase().includes("técnico") || 
    r.title.toLowerCase().includes("campo") ||
    r.permissions?.field_operations === true
  ) || [], [roles])

  const techRoleIds = useMemo(() => technicalRoles.map(r => r.id), [technicalRoles])

  const techniciansQuery = useMemoFirebase(() => {
    if (!companyId) return null
    return query(collection(db, "company_users"), where("companyId", "==", companyId))
  }, [db, companyId])
  const { data: allUsers, isLoading } = useCollection(techniciansQuery)

  const technicians = useMemo(() => allUsers?.filter(u => techRoleIds.includes(u.roleId)) || [], [allUsers, techRoleIds])

  const filteredTechs = technicians.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string
    const roleId = formData.get("roleId") as string

    try {
      const techData = {
        id: crypto.randomUUID(),
        companyId,
        name,
        email,
        roleId,
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDocumentNonBlocking(collection(db, "company_users"), techData)

      const secondaryAppName = `TechCreator_${Date.now()}`
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
      const secondaryAuth = getAuth(secondaryApp)

      try {
        await createUserWithEmailAndPassword(secondaryAuth, email, password)
        await signOut(secondaryAuth)
        await deleteApp(secondaryApp)
        toast({ title: "Técnico Habilitado", description: `Acceso creado para ${name}.` })
      } catch (authErr: any) {
        toast({ variant: "destructive", title: "Aviso de Registro", description: "Perfil técnico guardado, pero hubo un error al crear la cuenta de acceso." })
      }

      setIsAdding(false)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar al especialista." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateSignature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingTech) return
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    const signatureUrl = formData.get("signatureUrl") as string

    try {
      updateDocumentNonBlocking(doc(db, "company_users", editingTech.id), {
        signatureUrl,
        updatedAt: new Date().toISOString()
      })
      toast({ title: "Firma Actualizada", description: `Acreditación completa para ${editingTech.name}` })
      setEditingTech(null)
    } catch (err) {
      toast({ variant: "destructive", title: "Error al actualizar" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este perfil técnico? El acceso seguirá existiendo pero ya no pertenecerá a su organización.")) return
    deleteDocumentNonBlocking(doc(db, "company_users", id))
    toast({ variant: "destructive", title: "Técnico desvinculado" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 uppercase text-primary">Personal Técnico Acreditado</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Gestión de especialistas y firmas autorizadas NTP para certificados.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-[11px] shadow-lg px-6">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Nuevo Técnico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreateTechnician}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-primary">Alta de Personal Operativo</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Cree el perfil y las credenciales de acceso para el nuevo especialista.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500">Nombre Completo</Label>
                  <Input id="name" name="name" placeholder="Ej. Juan Pérez" required className="h-11 font-bold text-xs" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-500">Correo Corporativo</Label>
                  <Input id="email" name="email" type="email" placeholder="juan.perez@empresa.com" required className="h-11 font-bold text-xs" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" name="password" className="text-[10px] font-black uppercase text-slate-500">Contraseña de Acceso</Label>
                  <Input id="password" name="password" type="password" required placeholder="Mínimo 6 caracteres" className="h-11 font-bold text-xs" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="roleId" className="text-[10px] font-black uppercase text-slate-500">Rol / Especialidad</Label>
                  <Select name="roleId" required>
                    <SelectTrigger className="h-11 font-bold text-xs uppercase">
                      <SelectValue placeholder="Seleccione cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicalRoles.map(role => (
                        <SelectItem key={role.id} value={role.id} className="text-xs uppercase font-bold">{role.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 bg-primary text-white font-black uppercase text-xs" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                  Habilitar Técnico en EXTINPRO
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Briefcase className="h-3 w-3 text-primary" /> Especialistas Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{technicians.length}</div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Personal en campo</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-status-success" /> Aptos Certificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-status-success">
              {technicians.filter(t => t.signatureUrl).length}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Con firma digital registrada</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <PenTool className="h-3 w-3 text-accent" /> Pendientes de Firma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-accent">
              {technicians.length - technicians.filter(t => t.signatureUrl).length}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sin acreditación digital</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b bg-white p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="BUSCAR TÉCNICO POR NOMBRE O CORREO..." 
              className="pl-10 h-11 text-xs font-black uppercase border-2 focus:ring-primary" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table min-w-[1000px]">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px] py-4">Especialista</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Contacto</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Rol / Perfil</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-center">Firma Digital</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-center">Estado</TableHead>
                  <TableHead className="text-white text-right pr-8 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechs.map((tech) => (
                  <TableRow key={tech.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs shadow-inner">
                          {tech.name?.[0] || "T"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-primary uppercase text-[11px]">{tech.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ID: {tech.id.split('-')[0]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {tech.email}</span>
                        {tech.phone && <span className="text-[10px] font-bold flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {tech.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary px-3">
                        {roles?.find(r => r.id === tech.roleId)?.title || "Técnico"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        {tech.signatureUrl ? (
                          <div className="relative h-10 w-24 border rounded bg-white overflow-hidden p-1 shadow-sm">
                            <Image src={tech.signatureUrl} alt="Firma" fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[8px] font-black uppercase text-accent border-accent/20 bg-accent/5">
                            <XCircle className="h-2.5 w-2.5 mr-1" /> Sin Firma
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase px-3",
                        tech.status === "Active" ? "bg-status-success text-white" : "bg-slate-200 text-slate-600"
                      )}>
                        {tech.status === "Active" ? "DISPONIBLE" : "INACTIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => setEditingTech(tech)}>
                          <PenTool className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(tech.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTechs.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground opacity-40">
                      <Wrench className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No se han registrado especialistas en campo</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingTech} onOpenChange={(open) => !open && setEditingTech(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUpdateSignature}>
            <DialogHeader>
              <DialogTitle className="uppercase font-black text-primary">Gestionar Firma Digital</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase">Configure la firma autorizada para {editingTech?.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-48 border-2 border-dashed rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                  {editingTech?.signatureUrl ? (
                    <Image src={editingTech.signatureUrl} alt="Previsualización" fill className="object-contain p-2" unoptimized />
                  ) : (
                    <PenTool className="h-10 w-10 text-slate-200" />
                  )}
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase text-center">Se recomienda imagen PNG con fondo transparente.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signatureUrl" className="text-[10px] font-black uppercase text-slate-500">URL de la Imagen de Firma</Label>
                <Input 
                  id="signatureUrl" 
                  name="signatureUrl" 
                  defaultValue={editingTech?.signatureUrl} 
                  placeholder="https://servidor.com/firma-tecnico.png"
                  className="h-11 font-bold text-xs"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 bg-primary text-white font-black uppercase text-xs" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Firma del Especialista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-[#1c1c1c] text-white shadow-2xl border-none rounded-[2rem] overflow-hidden">
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
              <Award className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-2xl uppercase tracking-tighter">Certificación de Personal NTP</h3>
              <p className="text-sm opacity-70 font-bold uppercase text-[11px] tracking-wider max-w-xl">
                Los protocolos de operatividad de **EXTINPRO** requieren la firma de un técnico acreditado. Puede gestionar las firmas de todo su equipo desde este panel centralizado.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-accent text-white px-4 py-1 font-black text-[10px] uppercase">Multifirma Habilitada</Badge>
            <p className="text-[8px] font-bold uppercase opacity-40">EXTINPRO Technical Suite</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
