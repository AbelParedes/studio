
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileCheck, 
  Search, 
  Printer, 
  Download, 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  FlaskConical,
  Award,
  ClipboardCheck
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isAfter, parseISO, addMonths, addYears } from "date-fns"
import { es } from "date-fns/locale"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

export default function CertificatesRegistryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCert, setEditingCert] = useState<any | null>(null)

  // Perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // Clientes para el selector
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // Obtener certificados (citas completadas)
  const certificatesQuery = useMemoFirebase(() => 
    companyId ? query(
      collection(db, "appointments"), 
      where("companyId", "==", companyId),
      where("status", "==", "Completado")
    ) : null,
  [db, companyId])
  const { data: certificates, isLoading } = useCollection(certificatesQuery)

  const filteredCerts = useMemo(() => {
    return certificates?.filter(c => 
      c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (b.finishedAt || "").localeCompare(a.finishedAt || ""))
  }, [certificates, searchTerm])

  const handleSaveCertificate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId") as string
    const client = clients?.find(c => c.id === clientId)
    const serviceType = formData.get("serviceType") as string
    const executionDate = formData.get("date") as string

    // Sugerir fecha de vencimiento si no se provee
    let nextDue = formData.get("nextDue") as string
    if (!nextDue) {
      const dateObj = parseISO(executionDate)
      nextDue = serviceType === "Fumigación" 
        ? format(addMonths(dateObj, 6), "yyyy-MM-dd") 
        : format(addYears(dateObj, 1), "yyyy-MM-dd")
    }

    const certData = {
      companyId,
      clientId,
      clientName: client?.name || "Desconocido",
      serviceType,
      date: executionDate,
      nextDue,
      certificateNumber: formData.get("certificateNumber") as string,
      chemicalsUsed: formData.get("chemicalsUsed") as string,
      dosage: formData.get("dosage") as string,
      observations: formData.get("observations") as string,
      clientSignatureName: formData.get("clientSignatureName") as string,
      technicianName: profiles?.[0]?.name || "Administrador",
      status: "Completado",
      updatedAt: new Date().toISOString()
    }

    if (editingCert) {
      updateDocumentNonBlocking(doc(db, "appointments", editingCert.id), certData)
      toast({ title: "Certificado actualizado con éxito" })
    } else {
      const newCert = { 
        ...certData, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString(),
        finishedAt: new Date().toISOString()
      }
      addDocumentNonBlocking(collection(db, "appointments"), newCert)
      toast({ title: "Certificado emitido manualmente" })
    }

    setIsAdding(false)
    setEditingCert(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "appointments", id))
    toast({ variant: "destructive", title: "Certificado anulado" })
  }

  const openEdit = (cert: any) => {
    setEditingCert(cert)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Archivo de Protocolos Técnicos</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Gestión, emisión manual y control de vigencias.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingCert(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Certificado (Manual)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
              <form onSubmit={handleSaveCertificate} className="flex flex-col min-h-0 h-full">
                <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                  <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> 
                    {editingCert ? "Editar Protocolo Técnico" : "Emisión Manual de Certificado"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase">Complete los campos para generar la validez técnica oficial.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0">
                  {/* SECCIÓN 1: IDENTIFICACIÓN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Cliente Beneficiario</Label>
                      <Select name="clientId" defaultValue={editingCert?.clientId} required>
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map(c => (
                            <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Número de Certificado / Folio</Label>
                      <Input name="certificateNumber" defaultValue={editingCert?.certificateNumber} placeholder="Ej. CERT-2024-001" className="h-11 border-2 font-mono font-bold" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Tipo de Servicio</Label>
                      <Select name="serviceType" defaultValue={editingCert?.serviceType || "Extintores"} required>
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Extintores">Recarga/Mantenimiento Extintores</SelectItem>
                          <SelectItem value="Fumigación">Saneamiento (Fumigación)</SelectItem>
                          <SelectItem value="Inspección Técnica">Inspección Técnica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Fecha de Ejecución</Label>
                      <Input type="date" name="date" defaultValue={editingCert?.date || new Date().toISOString().split('T')[0]} className="h-11 border-2 font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Próximo Vencimiento</Label>
                      <Input type="date" name="nextDue" defaultValue={editingCert?.nextDue} className="h-11 border-2 font-bold border-accent/20" />
                    </div>
                  </div>

                  {/* SECCIÓN 2: DETALLES TÉCNICOS */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <h3 className="text-[11px] font-black uppercase text-primary tracking-widest">Especificaciones Técnicas</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Protocolo Sanitario (Solo Fumigación)</Label>
                        <div className="grid gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Producto e Ingrediente Activo</Label>
                            <Input name="chemicalsUsed" defaultValue={editingCert?.chemicalsUsed} placeholder="Ej. Cypermetrina 20%" className="h-9 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase text-slate-500">Dosificación Aplicada</Label>
                            <Input name="dosage" defaultValue={editingCert?.dosage} placeholder="Ej. 15cc / Litro" className="h-9 text-xs font-bold" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Observaciones Generales</Label>
                        <Textarea name="observations" defaultValue={editingCert?.observations} placeholder="Hallazgos técnicos o recomendaciones de seguridad..." className="min-h-[120px] text-xs font-medium border-2 rounded-2xl" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Nombre de quien autoriza (Cliente)</Label>
                    <Input name="clientSignatureName" defaultValue={editingCert?.clientSignatureName} placeholder="Nombre completo del representante" className="h-11 border-2 font-bold" />
                  </div>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                  <div className="flex gap-4 w-full">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-12 uppercase font-black text-[10px]">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] h-12 uppercase font-black text-xs bg-primary text-white shadow-xl">
                      {editingCert ? "Guardar Cambios en Protocolo" : "Emitir Certificado Oficial"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="h-10 text-[10px] font-bold uppercase">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar Vigencia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Protocolos Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-success">
              {certificates?.filter(c => !c.nextDue || isAfter(parseISO(c.nextDue), new Date())).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Vencimiento Próximo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-warning">
              {certificates?.filter(c => {
                if (!c.nextDue) return false
                const next = parseISO(c.nextDue)
                const thirtyDays = new Date()
                thirtyDays.setDate(thirtyDays.getDate() + 30)
                return isAfter(next, new Date()) && !isAfter(next, thirtyDays)
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Documentos Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {certificates?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente o N° Certificado..." 
              className="pl-9 h-10 text-xs font-bold uppercase" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">Folio / Protocolo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Empresa Beneficiaria</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Tipo de Servicio</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Emisión</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Vencimiento</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts?.map((cert) => {
                  const isExpired = cert.nextDue && !isAfter(parseISO(cert.nextDue), new Date())
                  return (
                    <TableRow key={cert.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-primary uppercase">
                        <div className="flex flex-col">
                          <span>{cert.certificateNumber || `CERT-${cert.id.split('-')[0].toUpperCase()}`}</span>
                          <span className="text-[8px] opacity-50 font-mono">ORD: {cert.id.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold uppercase text-[11px]">{cert.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 bg-primary/5">
                          {cert.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-medium">
                        {cert.date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-black",
                            isExpired ? "text-status-error" : "text-status-success"
                          )}>
                            {cert.nextDue || "---"}
                          </span>
                          {isExpired && <AlertCircle className="h-3 w-3 text-status-error animate-pulse" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-primary" 
                            title="Ver Protocolo"
                            onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-600" 
                            title="Editar Datos"
                            onClick={() => openEdit(cert)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-destructive" 
                            title="Anular"
                            onClick={() => handleDelete(cert.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredCerts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileCheck className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">No se han emitido protocolos aún</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-white shadow-xl border-none rounded-[2rem]">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase tracking-tight">Trazabilidad Industrial Asegurada</h3>
              <p className="text-sm opacity-80 font-medium max-w-xl">
                Cada certificado emitido queda vinculado permanentemente a la hoja de vida de los equipos del cliente, garantizando cumplimiento normativo total.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase text-accent bg-white px-6 py-2 rounded-full shadow-lg">
            Sistema de Certificación v5.5
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
