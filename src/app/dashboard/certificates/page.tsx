
"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Award, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  Printer, 
  ShieldCheck,
  HardDrive
} from "lucide-react"
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  useUser, 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function CertificatesPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCert, setEditingCert] = useState<any | null>(null)
  
  // States for equipment selection
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])

  // Profile and Company Context
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  
  // Memoize companyId to stabilize dependencies
  const companyId = useMemo(() => profiles?.[0]?.companyId, [profiles])

  // Data Collections
  const certsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "certificates"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: certificates, isLoading } = useCollection(certsRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const equipmentRef = useMemoFirebase(() => 
    (companyId && selectedClientId) ? query(collection(db, "client_equipment"), where("clientId", "==", selectedClientId)) : null,
  [db, companyId, selectedClientId])
  const { data: clientEquipment } = useCollection(equipmentRef)

  // Auto-generation of Certificate Number
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const suggestedCertNumber = useMemo(() => {
    if (!certificates || certificates.length === 0) return `CERT-${currentYear}-001`
    const yearCerts = certificates.filter(c => c.certificadoNumero?.includes(`-${currentYear}-`))
    const lastNum = yearCerts.length > 0 
      ? Math.max(...yearCerts.map(c => parseInt(c.certificadoNumero.split("-").pop() || "0"))) 
      : 0
    return `CERT-${currentYear}-${(lastNum + 1).toString().padStart(3, '0')}`
  }, [certificates, currentYear])

  // Cleanup effect to prevent infinite loop by moving state resets out of onOpenChange
  useEffect(() => {
    if (!isAdding) {
      setEditingCert(null)
      setSelectedEquipmentIds([])
      setSelectedClientId(null)
    }
  }, [isAdding])

  const handleSaveCertificate = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clienteId") as string
    const client = clients?.find(c => c.id === clientId)

    // Build technical extinguisher data from selection
    const technicalData = selectedEquipmentIds.map(id => {
      const equip = clientEquipment?.find(e => e.id === id)
      return {
        ns: equip?.serialNumber || "---",
        ff: equip?.manufacturingYear?.toString() || "---",
        tipo: equip?.type || "---",
        cap: equip?.capacity || "---",
        recarga: equip?.lastServiceDate || "---",
        vctoRecarga: equip?.nextServiceDate || "---",
        vctoPH: "---"
      }
    })

    const certData = {
      companyId,
      clienteId: clientId,
      clienteNombre: client?.name || "Desconocido",
      certificadoNumero: formData.get("number") as string || suggestedCertNumber,
      fechaEmision: formData.get("date") as string || format(new Date(), "yyyy-MM-dd"),
      tipoExtintor: formData.get("tipo") as string || "PQS",
      presionPrueba: formData.get("presionPrueba") as string || "---",
      presionTrabajo: formData.get("presionTrabajo") as string || "---",
      rating: formData.get("rating") as string || "---",
      normativa: "NTP 350.043",
      datosExtintor: technicalData,
      servicedEquipmentIds: selectedEquipmentIds,
      status: "Emitido",
      updatedAt: new Date().toISOString()
    }

    if (editingCert) {
      updateDocumentNonBlocking(doc(db, "certificates", editingCert.id), certData)
      toast({ title: "Certificado actualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "certificates"), { ...certData, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      toast({ title: "Certificado Emitido Correctamente" })
    }

    setIsAdding(false)
  }, [companyId, clients, selectedEquipmentIds, clientEquipment, suggestedCertNumber, editingCert, db])

  const handleDelete = (id: string) => {
    if(!confirm("¿Desea anular este certificado de forma permanente?")) return
    deleteDocumentNonBlocking(doc(db, "certificates", id))
    toast({ variant: "destructive", title: "Certificado eliminado" })
  }

  const openEdit = (cert: any) => {
    setEditingCert(cert)
    setSelectedClientId(cert.clienteId)
    setSelectedEquipmentIds(cert.servicedEquipmentIds || [])
    setIsAdding(true)
  }

  const filteredCerts = certificates?.filter(c => 
    c.certificadoNumero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 uppercase text-primary">Folios de Certificación NTP</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Protocolos de operatividad y mantenimiento de equipos.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-[11px] shadow-lg px-6">
              <Plus className="mr-2 h-4 w-4" /> Emitir Nuevo Folio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveCertificate} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                <DialogTitle className="uppercase font-black text-primary text-xl">Protocolo de Operatividad NTP</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Sugerido: {suggestedCertNumber}</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente Beneficiario</Label>
                    <Select name="clienteId" value={selectedClientId || ""} onValueChange={(val) => { setSelectedClientId(val); setSelectedEquipmentIds([]); }} required>
                      <SelectTrigger className="h-11 border-2 font-bold uppercase text-xs">
                        <SelectValue placeholder="Seleccione Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-bold text-xs uppercase">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">N° Folio / Certificado</Label>
                    <Input name="number" defaultValue={editingCert?.certificadoNumero || suggestedCertNumber} className="h-11 border-2 font-black uppercase text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Fecha Emisión</Label>
                    <Input name="date" type="date" defaultValue={editingCert?.fechaEmision || format(new Date(), "yyyy-MM-dd")} className="h-11 border-2 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Tipo Agente</Label>
                    <Select name="tipo" defaultValue={editingCert?.tipoExtintor || "PQS"}>
                      <SelectTrigger className="h-10 border-2 text-xs font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PQS">PQS - ABC</SelectItem>
                        <SelectItem value="CO2">CO2</SelectItem>
                        <SelectItem value="H2O">AGUA (H2O)</SelectItem>
                        <SelectItem value="K">POTASIO (K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">P. Prueba</Label>
                    <Input name="presionPrueba" defaultValue={editingCert?.presionPrueba || "KPA 3400"} className="h-10 border-2 font-bold text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">P. Trabajo</Label>
                    <Input name="presionTrabajo" defaultValue={editingCert?.presionTrabajo || "KPA 1345"} className="h-10 border-2 font-bold text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Rating</Label>
                    <Input name="rating" defaultValue={editingCert?.rating || "4A - 40 BC"} className="h-10 border-2 font-bold text-xs" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                    <h3 className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <HardDrive className="h-4 w-4" /> Equipos a Certificar (Hoja de Vida)
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-black">{selectedEquipmentIds.length} Seleccionados</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {clientEquipment && clientEquipment.length > 0 ? (
                      clientEquipment.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => toggleEquipment(item.id)}
                          className={cn(
                            "flex items-center justify-between p-3 border-2 rounded-xl transition-all cursor-pointer",
                            selectedEquipmentIds.includes(item.id) ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={selectedEquipmentIds.includes(item.id)} onCheckedChange={() => toggleEquipment(item.id)} />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase text-primary">{item.serialNumber}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{item.type} • {item.capacity}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[8px] font-black uppercase bg-white">{item.location || "S/U"}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-10 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          {selectedClientId ? "No hay equipos registrados para este cliente" : "Seleccione un cliente para ver sus equipos"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl">
                  {editingCert ? "Guardar Cambios" : "Emitir Protocolo de Operatividad"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por N° Folio o Cliente..." 
              className="pl-9 h-10 text-xs font-bold uppercase" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table min-w-[800px] lg:min-w-full">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">Folio NTP</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Beneficiario</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Especificación</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Equipos</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts?.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                    <TableCell className="font-black text-primary uppercase tracking-tight">
                      <div className="flex flex-col">
                        <span>{cert.certificadoNumero}</span>
                        <span className="text-[8px] opacity-50 font-mono">{cert.fechaEmision}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold uppercase text-[11px]">{cert.clienteNombre}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="text-[8px] font-black uppercase w-fit">{cert.tipoExtintor}</Badge>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{cert.presionPrueba} / {cert.presionTrabajo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] font-black px-2">{cert.datosExtintor?.length || 0} UNI</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-status-success/10 text-status-success border-status-success/20 text-[9px] font-black uppercase">{cert.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={() => openEdit(cert)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(cert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCerts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Award className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">No se han emitido certificados aún</p>
                      </div>
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
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Validez Técnica Garantizada</h3>
              <p className="text-sm opacity-80 font-medium uppercase text-[10px] tracking-widest mt-1">
                Certificados alineados con la NTP 350.043-1 para auditorías de INDECI y Municipalidades.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase text-accent bg-white px-4 py-1.5 rounded-full shadow-lg">
            Sistema de Certificación v4.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
