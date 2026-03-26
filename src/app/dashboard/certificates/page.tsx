
"use client"

import React, { useState, useMemo, useCallback } from "react"
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
  HardDrive,
  UserCheck
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

const CertificateForm = React.memo(({ 
  companyId, 
  editingCert, 
  suggestedCertNumber, 
  clients, 
  technicians,
  onSave 
}: any) => {
  const db = useFirestore()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(editingCert?.clienteId || null)
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(editingCert?.servicedEquipmentIds || [])

  const equipmentRef = useMemoFirebase(() => 
    (companyId && selectedClientId) ? query(collection(db, "client_equipment"), where("clientId", "==", selectedClientId)) : null,
  [db, companyId, selectedClientId])
  const { data: clientEquipment, isLoading: loadingEquip } = useCollection(equipmentRef)

  const toggleEquipment = useCallback((id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    )
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const clientId = formData.get("clienteId") as string
    const client = clients?.find((c: any) => c.id === clientId)
    const techId = formData.get("technicianId") as string
    const technician = technicians?.find((t: any) => t.id === techId)

    const technicalData = selectedEquipmentIds.map(id => {
      const equip = clientEquipment?.find(e => e.id === id)
      return {
        ns: equip?.serialNumber || "---",
        ff: equip?.manufacturingYear?.toString() || "---",
        tipo: equip?.extinguishingAgent || equip?.type || "---",
        cap: equip?.capacity || "---",
        recarga: equip?.lastServiceDate || "---",
        vctoRecarga: equip?.nextServiceDate || "---",
        vctoPH: equip?.nextHydrostaticTestDate || "---"
      }
    })

    const certData = {
      clienteId: clientId,
      clienteNombre: client?.name || "Desconocido",
      technicianId: techId,
      technicianName: technician?.name || "Sin Asignar",
      certificadoNumero: formData.get("number") as string || suggestedCertNumber,
      fechaEmision: formData.get("date") as string || format(new Date(), "yyyy-MM-dd"),
      tipoExtintor: formData.get("tipo") as string || "PQS",
      presionPrueba: formData.get("presionPrueba") as string || "---",
      presionTrabajo: formData.get("presionTrabajo") as string || "---",
      rating: formData.get("rating") as string || "---",
      normativa: "NTP 350.043",
      datosExtintor: technicalData,
      servicedEquipmentIds: selectedEquipmentIds,
      status: "Emitido"
    }

    onSave(certData)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Cliente</Label>
            <Select name="clienteId" defaultValue={selectedClientId || ""} onValueChange={(val) => { setSelectedClientId(val); setSelectedEquipmentIds([]); }} required>
              <SelectTrigger className="h-11 border-2 text-xs uppercase font-bold"><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>{clients?.map((c: any) => (<SelectItem key={c.id} value={c.id} className="font-bold text-xs uppercase">{c.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Técnico Certificador</Label>
            <Select name="technicianId" defaultValue={editingCert?.technicianId} required>
              <SelectTrigger className="h-11 border-2 text-xs uppercase font-bold"><SelectValue placeholder="Seleccione Técnico" /></SelectTrigger>
              <SelectContent>{technicians?.map((t: any) => (<SelectItem key={t.id} value={t.id} className="font-bold text-xs uppercase">{t.name} {t.signatureUrl ? '✓' : '(Sin Firma)'}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">N° Certificado</Label>
            <Input name="number" defaultValue={editingCert?.certificadoNumero || suggestedCertNumber} className="h-11 border-2 font-black text-xs uppercase" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Fecha</Label>
            <Input name="date" type="date" defaultValue={editingCert?.fechaEmision || format(new Date(), "yyyy-MM-dd")} className="h-11 border-2 font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">Agente</Label>
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
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-[11px] font-black uppercase text-primary flex items-center gap-2"><HardDrive className="h-4 w-4" /> Equipos del Cliente</h3>
            <Badge variant="outline" className="text-[9px] font-black">{selectedEquipmentIds.length} Seleccionados</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingEquip ? (
              <div className="col-span-2 py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : clientEquipment && clientEquipment.length > 0 ? (
              clientEquipment.map(item => (
                <div key={item.id} onClick={() => toggleEquipment(item.id)} className={cn("flex items-center justify-between p-3 border-2 rounded-xl transition-all cursor-pointer", selectedEquipmentIds.includes(item.id) ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 hover:border-slate-200 bg-slate-50/50")}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedEquipmentIds.includes(item.id)} onCheckedChange={() => toggleEquipment(item.id)} onClick={(e) => e.stopPropagation()} />
                    <div className="flex flex-col"><span className="text-[11px] font-black uppercase text-primary">{item.serialNumber}</span><span className="text-[9px] font-bold text-slate-400 uppercase">{item.type} • {item.capacity} • PH: {item.nextHydrostaticTestDate || 'S/F'}</span></div>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black uppercase bg-white">{item.location || "S/U"}</Badge>
                </div>
              ))
            ) : (<div className="col-span-2 py-10 text-center text-slate-400 font-bold uppercase text-[10px]">No hay equipos o cliente no seleccionado</div>)}
          </div>
        </div>
      </div>
      <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
        <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl">Emitir Certificado</Button>
      </DialogFooter>
    </form>
  )
})

CertificateForm.displayName = "CertificateForm"

export default function CertificatesRegistryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [modalState, setModalState] = useState<{ open: boolean, editing: any | null }>({ open: false, editing: null })

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = useMemo(() => profiles?.[0]?.companyId, [profiles])

  const certsRef = useMemoFirebase(() => companyId ? query(collection(db, "certificates"), where("companyId", "==", companyId)) : null, [db, companyId])
  const { data: certificates, isLoading } = useCollection(certsRef)

  const clientsRef = useMemoFirebase(() => companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null, [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // Obtener roles para filtrar técnicos
  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: allRoles } = useCollection(rolesRef)
  const techRoleIds = useMemo(() => allRoles?.filter(r => 
    r.title.toLowerCase().includes("técnico") || 
    r.title.toLowerCase().includes("campo") ||
    r.permissions?.field_operations === true
  ).map(r => r.id) || [], [allRoles])

  const usersRef = useMemoFirebase(() => companyId ? query(collection(db, "company_users"), where("companyId", "==", companyId)) : null, [db, companyId])
  const { data: companyUsers } = useCollection(usersRef)

  // Filtrar solo usuarios con roles técnicos
  const technicians = useMemo(() => 
    companyUsers?.filter(u => techRoleIds.includes(u.roleId)) || [], 
  [companyUsers, techRoleIds])

  const suggestedCertNumber = useMemo(() => {
    const currentYear = new Date().getFullYear()
    if (!certificates || certificates.length === 0) return `CERT-${currentYear}-001`
    const yearCerts = certificates.filter(c => c.certificadoNumero?.includes(`-${currentYear}-`))
    if (yearCerts.length === 0) return `CERT-${currentYear}-001`
    const lastNum = Math.max(...yearCerts.map(c => parseInt(c.certificadoNumero?.split("-").pop() || "0"))) || 0
    return `CERT-${currentYear}-${(lastNum + 1).toString().padStart(3, '0')}`
  }, [certificates])

  const handleSaveCertificate = useCallback((certData: any) => {
    if (!companyId) return
    const finalData = { ...certData, companyId, updatedAt: new Date().toISOString() }
    if (modalState.editing) {
      updateDocumentNonBlocking(doc(db, "certificates", modalState.editing.id), finalData)
      toast({ title: "Certificado actualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "certificates"), { ...finalData, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      toast({ title: "Certificado Emitido" })
    }
    setModalState({ open: false, editing: null })
  }, [companyId, modalState.editing, db])

  const handleOpenChange = useCallback((open: boolean) => {
    setModalState(prev => ({ open, editing: open ? prev.editing : null }))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 uppercase text-primary">Protocolos de Certificación NTP</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Emisión oficial de operatividad de equipos.</p>
        </div>
        <Dialog open={modalState.open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild><Button className="bg-primary text-white h-10 font-bold uppercase text-[11px] shadow-lg px-6" onClick={() => setModalState({ open: true, editing: null })}><Plus className="mr-2 h-4 w-4" /> Emitir Nuevo Protocolo</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-slate-50"><DialogTitle className="uppercase font-black text-primary text-xl">Protocolo de Operatividad</DialogTitle><DialogDescription className="text-[10px] font-bold uppercase">Correlativo sugerido: {suggestedCertNumber}</DialogDescription></DialogHeader>
            {modalState.open && <CertificateForm companyId={companyId} editingCert={modalState.editing} suggestedCertNumber={suggestedCertNumber} clients={clients} technicians={technicians} onSave={handleSaveCertificate} />}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white p-4"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por N° o Cliente..." className="pl-9 h-10 text-xs font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (<div className="flex items-center justify-center p-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>) : (
            <Table className="dense-table min-w-[800px]">
              <TableHeader className="bg-[#1c1c1c]"><TableRow className="border-none"><TableHead className="text-white font-black uppercase text-[10px]">Certificado NTP</TableHead><TableHead className="text-white font-black uppercase text-[10px]">Beneficiario</TableHead><TableHead className="text-white font-black uppercase text-[10px]">Técnico</TableHead><TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead><TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {certificates?.filter(c => c.certificadoNumero?.toLowerCase().includes(searchTerm.toLowerCase()) || c.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())).map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-black text-primary uppercase">{cert.certificadoNumero}</TableCell>
                    <TableCell className="font-bold uppercase text-[11px]">{cert.clienteNombre}</TableCell>
                    <TableCell className="text-[10px] font-bold uppercase text-slate-500"><div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> {cert.technicianName}</div></TableCell>
                    <TableCell><Badge className="bg-status-success/10 text-status-success border-status-success/20 text-[9px] font-black uppercase">{cert.status}</Badge></TableCell>
                    <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}><Printer className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={() => setModalState({ open: true, editing: cert })}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, "certificates", cert.id))}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
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
