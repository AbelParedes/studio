
"use client"

import { useState, useMemo, useEffect } from "react"
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
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  Filter,
  FileText,
  Plus,
  Edit2,
  Trash2,
  FlaskConical,
  ClipboardCheck,
  Bug,
  Hash,
  HardDrive
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isAfter, parseISO, addMonths, addYears } from "date-fns"
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

const PESTS = ["Cucarachas", "Roedores", "Hormigas", "Pulgas", "Arácnidos", "Voladores", "Termitas", "Palomas"]

export default function CertificatesRegistryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCert, setEditingCert] = useState<any | null>(null)
  const [selectedPests, setSelectedPests] = useState<string[]>([])
  
  // Estado para rastrear el cliente seleccionado en el diálogo y sus equipos
  const [dialogClientId, setDialogClientId] = useState<string>("")
  const [dialogServiceType, setDialogServiceType] = useState<string>("Extintores")
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])

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

  // Equipos del cliente seleccionado en el diálogo
  const clientEquipmentQuery = useMemoFirebase(() => 
    dialogClientId ? query(collection(db, "client_equipment"), where("clientId", "==", dialogClientId)) : null,
  [db, dialogClientId])
  const { data: clientEquipment, isLoading: loadingEquip } = useCollection(clientEquipmentQuery)

  // Obtener certificados (citas completadas)
  const certificatesQuery = useMemoFirebase(() => 
    companyId ? query(
      collection(db, "appointments"), 
      where("companyId", "==", companyId),
      where("status", "==", "Completado")
    ) : null,
  [db, companyId])
  const { data: certificates, isLoading } = useCollection(certificatesQuery)

  // Lógica de Numeración Automática Cert_YYYY_NNN
  const currentYear = new Date().getFullYear()
  const suggestedCertNumber = useMemo(() => {
    if (!certificates || certificates.length === 0) return `Cert_${currentYear}_001`
    
    const yearCerts = certificates.filter(c => {
      const cNum = c.certificateNumber || ""
      return cNum.startsWith(`Cert_${currentYear}_`)
    })

    if (yearCerts.length === 0) return `Cert_${currentYear}_001`

    const numbers = yearCerts.map(c => {
      const parts = c.certificateNumber.split("_")
      return parts.length === 3 ? parseInt(parts[2]) : 0
    })
    
    const maxNum = Math.max(...numbers)
    return `Cert_${currentYear}_${(maxNum + 1).toString().padStart(3, '0')}`
  }, [certificates, currentYear])

  const filteredCerts = useMemo(() => {
    return certificates?.filter(c => 
      c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  }, [certificates, searchTerm])

  const handlePestToggle = (pest: string) => {
    setSelectedPests(prev => 
      prev.includes(pest) ? prev.filter(p => p !== pest) : [...prev, pest]
    )
  }

  const handleEquipmentToggle = (equipId: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(equipId) ? prev.filter(id => id !== equipId) : [...prev, equipId]
    )
  }

  const handleSaveCertificate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clientId") as string
    const client = clients?.find(c => c.id === clientId)
    const serviceType = formData.get("serviceType") as string
    const executionDate = formData.get("date") as string

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
      clientTaxId: client?.taxId || "",
      clientAddress: client?.address || "",
      serviceType,
      date: executionDate,
      nextDue,
      certificateNumber: formData.get("certificateNumber") as string || suggestedCertNumber,
      chemicalsUsed: formData.get("chemicalsUsed") as string,
      dosage: formData.get("dosage") as string,
      pestTargeted: selectedPests,
      servicedEquipmentIds: selectedEquipmentIds, // Incluimos los equipos seleccionados
      observations: formData.get("observations") as string,
      clientSignatureName: formData.get("clientSignatureName") as string,
      technicianName: formData.get("technicianName") as string || profiles?.[0]?.name,
      status: "Completado",
      updatedAt: new Date().toISOString()
    }

    if (editingCert) {
      updateDocumentNonBlocking(doc(db, "appointments", editingCert.id), certData)
      toast({ title: "Protocolo técnico actualizado" })
    } else {
      const newCert = { 
        ...certData, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString()
      }
      addDocumentNonBlocking(collection(db, "appointments"), newCert)
      toast({ title: "Certificado emitido con éxito" })
    }

    setIsAdding(false)
    setEditingCert(null)
    setSelectedPests([])
    setSelectedEquipmentIds([])
    setDialogClientId("")
  }

  const openEdit = (cert: any) => {
    setEditingCert(cert)
    setDialogClientId(cert.clientId || "")
    setDialogServiceType(cert.serviceType || "Extintores")
    setSelectedPests(cert.pestTargeted || [])
    setSelectedEquipmentIds(cert.servicedEquipmentIds || [])
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Archivo de Protocolos Técnicos</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Gestión oficial DIRIS/DIGESA y NTP.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingCert(null); setSelectedEquipmentIds([]); setDialogClientId(""); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Certificado (Manual)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
              <form onSubmit={handleSaveCertificate} className="flex flex-col min-h-0 h-full">
                <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                  <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> 
                    {editingCert ? "Editar Protocolo Técnico" : "Emisión Manual de Certificado"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase">Configure los parámetros para la validez técnica oficial.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Cliente Beneficiario</Label>
                      <Select 
                        name="clientId" 
                        value={dialogClientId} 
                        onValueChange={setDialogClientId}
                        required
                      >
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
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Número de Folio / Certificado
                      </Label>
                      <Input 
                        name="certificateNumber" 
                        defaultValue={editingCert?.certificateNumber || suggestedCertNumber} 
                        placeholder="Ej. Cert_2025_001" 
                        className="h-11 border-2 font-mono font-bold text-primary" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Tipo de Certificación</Label>
                      <Select 
                        name="serviceType" 
                        value={dialogServiceType} 
                        onValueChange={setDialogServiceType}
                        required
                      >
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Extintores">Operatividad Extintores (NTP)</SelectItem>
                          <SelectItem value="Fumigación">Saneamiento Ambiental (DIRIS)</SelectItem>
                          <SelectItem value="Inspección Técnica">Inspección Técnica (NFPA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Fecha de Ejecución</Label>
                      <Input type="date" name="date" defaultValue={editingCert?.date || new Date().toISOString().split('T')[0]} className="h-11 border-2 font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Vencimiento</Label>
                      <Input type="date" name="nextDue" defaultValue={editingCert?.nextDue} className="h-11 border-2 font-bold border-accent/20" />
                    </div>
                  </div>

                  {/* SECCIÓN DINÁMICA: EQUIPOS O FUMIGACIÓN */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <h3 className="text-[11px] font-black uppercase text-primary tracking-widest">
                        {dialogServiceType === "Fumigación" ? "Protocolo de Aplicación (DIRIS)" : "Inventario de Equipos (NTP)"}
                      </h3>
                    </div>

                    {dialogServiceType === "Fumigación" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="grid gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-bold uppercase text-slate-500 flex items-center gap-1"><FlaskConical className="h-3 w-3" /> Producto e Ingrediente Activo</Label>
                              <Input name="chemicalsUsed" defaultValue={editingCert?.chemicalsUsed} placeholder="Ej. Cypermetrina 20% / Reg. Sanitario" className="h-9 text-xs font-bold" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-bold uppercase text-slate-500">Dosificación Aplicada</Label>
                              <Input name="dosage" defaultValue={editingCert?.dosage} placeholder="Ej. 10cc / Litro" className="h-9 text-xs font-bold" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1"><Bug className="h-3 w-3" /> Control Biológico (Plagas)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {PESTS.map(pest => (
                                <div key={pest} className="flex items-center space-x-2 border p-2 rounded-lg bg-white">
                                  <Checkbox 
                                    id={`pest-${pest}`} 
                                    checked={selectedPests.includes(pest)} 
                                    onCheckedChange={() => handlePestToggle(pest)} 
                                  />
                                  <Label htmlFor={`pest-${pest}`} className="text-[9px] font-bold uppercase cursor-pointer">{pest}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Observaciones y Hallazgos</Label>
                          <Textarea name="observations" defaultValue={editingCert?.observations} placeholder="Recomendaciones de seguridad o detalles de operatividad..." className="min-h-[200px] text-xs font-medium border-2 rounded-2xl" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                            <HardDrive className="h-3 w-3 text-accent" /> Seleccionar Extintores para este Protocolo
                          </Label>
                          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed min-h-[200px] space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {!dialogClientId ? (
                              <p className="text-[10px] text-center text-slate-400 uppercase font-bold py-10">Seleccione un cliente para ver sus equipos</p>
                            ) : loadingEquip ? (
                              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : clientEquipment && clientEquipment.length > 0 ? (
                              clientEquipment.map(item => (
                                <div key={item.id} className={cn(
                                  "flex items-center justify-between p-3 border-2 rounded-xl transition-all cursor-pointer bg-white",
                                  selectedEquipmentIds.includes(item.id) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                                )} onClick={() => handleEquipmentToggle(item.id)}>
                                  <div className="flex items-center gap-3">
                                    <Checkbox 
                                      checked={selectedEquipmentIds.includes(item.id)} 
                                      onCheckedChange={() => handleEquipmentToggle(item.id)}
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black uppercase">{item.serialNumber}</span>
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">{item.type} • {item.location}</span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[7px] font-black uppercase">{item.status}</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-center text-slate-400 uppercase font-bold py-10">No hay equipos registrados para este cliente</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Observaciones de Inspección NTP</Label>
                          <Textarea name="observations" defaultValue={editingCert?.observations} placeholder="Describa el estado de operatividad de los equipos inspeccionados..." className="min-h-[200px] text-xs font-medium border-2 rounded-2xl" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Técnico Responsable</Label>
                      <Input name="technicianName" defaultValue={editingCert?.technicianName || profiles?.[0]?.name} className="h-11 border-2 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Persona que Autoriza (Cliente)</Label>
                      <Input name="clientSignatureName" defaultValue={editingCert?.clientSignatureName} className="h-11 border-2 font-bold" />
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                  <div className="flex gap-4 w-full">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-12 uppercase font-black text-[10px]">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] h-12 uppercase font-black text-xs bg-primary text-white shadow-xl">
                      {editingCert ? "Actualizar Documento" : "Emitir Certificado Maestro"}
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
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Documentos en Archivo</CardTitle>
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
              placeholder="Buscar cliente o N° Folio..." 
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
                  <TableHead className="text-white font-black uppercase text-[10px]">Tipo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Emisión</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Vencimiento</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts?.map((cert) => {
                  const isExpired = cert.nextDue && !isAfter(parseISO(cert.nextDue), new Date())
                  return (
                    <TableRow key={cert.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-primary uppercase">
                        {cert.certificateNumber || `Cert_${cert.id.split('-')[0].toUpperCase()}`}
                      </TableCell>
                      <TableCell className="font-bold uppercase text-[11px]">{cert.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase",
                          cert.serviceType === "Fumigación" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-primary/20 bg-primary/5"
                        )}>
                          {cert.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-medium">{cert.date}</TableCell>
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
                            onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-600" 
                            onClick={() => openEdit(cert)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-destructive" 
                            onClick={() => { if(confirm("¿Anular este protocolo oficial?")) deleteDocumentNonBlocking(doc(db, "appointments", cert.id)); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
