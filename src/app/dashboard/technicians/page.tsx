"use client"

import { useState } from "react"
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
  Award
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function TechniciansPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // 1. Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Obtener Roles para identificar cuáles son técnicos
  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles } = useCollection(rolesRef)
  
  const techRoleIds = roles?.filter(r => 
    r.title.toLowerCase().includes("técnico") || 
    r.title.toLowerCase().includes("campo") ||
    r.permissions?.field_operations === true
  ).map(r => r.id) || []

  // 3. Obtener Usuarios de la empresa que sean técnicos
  const techniciansQuery = useMemoFirebase(() => {
    if (!companyId) return null
    return query(collection(db, "company_users"), where("companyId", "==", companyId))
  }, [db, companyId])
  const { data: allUsers, isLoading } = useCollection(techniciansQuery)

  // Filtrar solo los que tienen rol técnico
  const technicians = allUsers?.filter(u => techRoleIds.includes(u.roleId))

  const filteredTechs = technicians?.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este perfil técnico? Esto no borrará su cuenta de acceso, solo su ficha en esta empresa.")) return
    deleteDocumentNonBlocking(doc(db, "company_users", id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 uppercase text-primary">Personal Técnico NTP</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Gestión de especialistas y firmas autorizadas.</p>
        </div>
        <Button className="bg-primary text-white h-10 font-bold uppercase text-[11px] shadow-lg" onClick={() => router.push('/dashboard/users')}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Técnico
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Especialistas Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{technicians?.length || 0}</div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Personal en campo</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Firmas Digitales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-status-success">
              {technicians?.filter(t => t.signatureUrl).length || 0}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Aptos para certificar</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pendientes de Firma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-accent">
              {(technicians?.length || 0) - (technicians?.filter(t => t.signatureUrl).length || 0)}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Acción requerida</p>
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
                {filteredTechs?.map((tech) => (
                  <TableRow key={tech.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                          {tech.name?.[0] || "T"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-primary uppercase text-[11px]">{tech.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {tech.id.split('-')[0]}</span>
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
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => router.push('/dashboard/settings')}>
                          <PenTool className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(tech.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredTechs || filteredTechs.length === 0) && (
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

      <Card className="bg-[#1c1c1c] text-white shadow-2xl border-none rounded-[2rem] overflow-hidden">
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
              <Award className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-2xl uppercase tracking-tighter">Certificación de Personal NTP</h3>
              <p className="text-sm opacity-70 font-bold uppercase text-[11px] tracking-wider max-w-xl">
                Los certificados de operatividad requieren la firma de un técnico acreditado. Asegúrese de que cada especialista tenga su firma digital transparente configurada en los ajustes.
              </p>
            </div>
          </div>
          <Button variant="outline" className="h-14 border-2 border-white/20 text-white hover:bg-white hover:text-black font-black uppercase text-[11px] px-10 rounded-xl" onClick={() => router.push('/dashboard/settings')}>
            Configurar Firmas
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
