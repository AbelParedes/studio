
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileCheck, 
  Search, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Hash,
  HardDrive
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isAfter, parseISO, addYears } from "date-fns"
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
  
  const [dialogClientId, setDialogClientId] = useState<string>("")
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])

  // 1. Obtención estable del perfil y companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId || ""

  // 2. Consultas estabilizadas por companyId
  const clientsQuery = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsQuery)

  const certificatesQuery = useMemoFirebase(() => 
    companyId ? query(
      collection(db, "appointments"), 
      where("companyId", "==", companyId),
      where("status", "==", "Completado")
    ) : null,
  [db, companyId])
  const { data: certificates, isLoading: loadingCerts } = useCollection(certificatesQuery)

  // 3. Consulta de equipos supeditada a dialogClientId (solo cuando el diálogo está abierto)
  const clientEquipmentQuery = useMemoFirebase(() => 
    isAdding && dialogClientId ? query(collection(db, "client_equipment"), where("clientId", "==", dialogClientId)) : null,
  [db, dialogClientId, isAdding])
  const { data: clientEquipment, isLoading: loadingEquip } = useCollection(clientEquipmentQuery)

  const currentYear = useMemo(() => new Date().getFullYear(), [])
  
  const suggestedCertNumber = useMemo(() => {
    if (!certificates || certificates.length === 0) return `Cert_${currentYear}_001`
    const yearCerts = certificates.filter(c => (c.certificateNumber || "").startsWith(`Cert_${currentYear}_`))
    if (yearCerts.length === 0) return `Cert_${currentYear}_001`
    const numbers = yearCerts.map(c => {
      const parts = c.certificateNumber.split("_")
      return parts.length === 3 ? parseInt(parts[2]) : 0
    })
    const maxNum = Math.max(...numbers)
    return `Cert_${currentYear}_${(maxNum + 1).toString().padStart(3, '0')}`
  }, [certificates, currentYear])

  // Limpiar estados locales al cerrar el diálogo para evitar bucles de renderizado
  const handleOpenChange = (open: boolean) => {
    setIsAdding(open)
    if (!open) {
      setEditingCert(null)
      setDialogClientId("")
      setSelectedEquipmentIds([])
    }
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
      nextDue = format(addYears(dateObj, 1), "yyyy-MM-dd")
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
      servicedEquipmentIds: selectedEquipmentIds,
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
      addDocumentNonBlocking(collection(db, "appointments"), { 
        ...certData, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString() 
      })
      toast({ title: "Protocolo emitido con éxito" })
    }

    setIsAdding(false)
  }

  const filteredCerts = useMemo(() => {
    return (certificates || []).filter(c => 
      c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  }, [certificates, searchTerm])

  const openEdit = (cert: any) => {
    setEditingCert(cert)
    setDialogClientId(cert.clientId || "")
    setSelectedEquipmentIds(cert.servicedEquipmentIds || [])
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Protocolos de Operatividad NTP</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Gestión de certificados de extintores (Norma Técnica Peruana).</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Protocolo (Manual)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveCertificate} className="flex flex-col min-h-0 h-full">
              <DialogHeader className="p-6 border-b bg-slate-50">
                <DialogTitle className="uppercase font-black text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> 
                  {editingCert ? "Editar Protocolo Técnico" : "Emisión Manual de Certificado"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Validez técnica para equipos contra incendios según NTP 350.043-1.</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente Beneficiario</Label>
                    <Select name="clientId" value={dialogClientId} onValueChange={setDialogClientId} required>
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
                      <Hash className="h-3 w-3" /> Número de Folio
                    </Label>
                    <Input name="certificateNumber" defaultValue={editingCert?.certificateNumber || suggestedCertNumber} className="h-11 border-2 font-mono font-bold text-primary" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Tipo de Servicio</Label>
                    <Select name="serviceType" defaultValue={editingCert?.serviceType || "Mantenimiento"} required>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mantenimiento">Mantenimiento Anual</SelectItem>
                        <SelectItem value="Recarga">Recarga de Agente</SelectItem>
                        <SelectItem value="Inspección">Inspección Trimestral</SelectItem>
                        <SelectItem value="Alquiler">Alquiler / Préstamo</SelectItem>
                        <SelectItem value="Venta">Venta / Entrega</SelectItem>
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

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> Selección de Extintores (Hoja de Vida)
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
                            <Checkbox checked={selectedEquipmentIds.includes(item.id)} onCheckedChange={() => handleEquipmentToggle(item.id)} />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase">{item.serialNumber}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">{item.type} • {item.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[7px] font-black uppercase">{item.status}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-center text-slate-400 uppercase font-bold py-10">Sin equipos registrados en este cliente</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Observaciones de Operatividad</Label>
                  <Textarea name="observations" defaultValue={editingCert?.observations} placeholder="Indique el estado de los componentes (manómetros, precintos, cilindro)..." className="min-h-[120px] text-xs font-medium border-2 rounded-2xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Técnico Autorizado</Label>
                    <Input name="technicianName" defaultValue={editingCert?.technicianName || profiles?.[0]?.name} className="h-11 border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Persona que Recibe (Cliente)</Label>
                    <Input name="clientSignatureName" defaultValue={editingCert?.clientSignatureName} className="h-11 border-2 font-bold" />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50">
                <Button type="submit" className="w-full h-12 uppercase font-black text-xs bg-primary text-white shadow-xl">
                  {editingCert ? "Actualizar Protocolo" : "Emitir Protocolo Oficial NTP"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-success">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Protocolos Vigentes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-status-success">{certificates?.filter(c => !c.nextDue || isAfter(parseISO(c.nextDue), new Date())).length || 0}</div></CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-warning">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Vencimiento Próximo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-status-warning">{certificates?.filter(c => { if (!c.nextDue) return false; const next = parseISO(c.nextDue); const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30); return isAfter(next, new Date()) && !isAfter(next, thirtyDays); }).length || 0}</div></CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Protocolos en Archivo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">{certificates?.length || 0}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por N° Folio o Cliente..." className="pl-9 h-10 text-xs font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {loadingCerts ? (
            <div className="flex items-center justify-center p-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            <Table className="dense-table min-w-[800px]">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow>
                  <TableHead className="text-white font-black uppercase text-[10px]">Folio / Protocolo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Cliente Beneficiario</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Servicio</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Emisión</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Vencimiento</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts?.map((cert) => {
                  const isExpired = cert.nextDue && !isAfter(parseISO(cert.nextDue), new Date())
                  return (
                    <TableRow key={cert.id} className="hover:bg-muted/30 border-slate-100">
                      <TableCell className="font-black text-primary uppercase">{cert.certificateNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px]">{cert.clientName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase bg-primary/5">{cert.serviceType}</Badge></TableCell>
                      <TableCell className="text-[11px] font-medium">{cert.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[11px] font-black", isExpired ? "text-status-error" : "text-status-success")}>{cert.nextDue || "---"}</span>
                          {isExpired && <AlertCircle className="h-3 w-3 text-status-error animate-pulse" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600" onClick={() => openEdit(cert)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => { if(confirm("¿Anular este protocolo?")) deleteDocumentNonBlocking(doc(db, "appointments", cert.id)); }}><Trash2 className="h-4 w-4" /></Button>
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
