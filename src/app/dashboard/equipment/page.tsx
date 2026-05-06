"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  HardDrive, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileText,
  Building2,
  Tag,
  Factory,
  Flame,
  ShieldCheck,
  Zap,
  Droplets
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
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
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isAfter, parseISO, addYears } from "date-fns"
import { es } from "date-fns/locale"

export default function ClientEquipmentPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const equipmentRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "client_equipment"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: equipment, isLoading } = useCollection(equipmentRef)

  const handleSaveEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const equipmentData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      type: formData.get("type") as string,
      serialNumber: formData.get("serialNumber") as string,
      brand: formData.get("brand") as string,
      capacity: formData.get("capacity") as string,
      extinguishingAgent: formData.get("agent") as string,
      location: formData.get("location") as string,
      manufacturingYear: Number(formData.get("year")),
      lastServiceDate: formData.get("lastService") as string,
      nextServiceDate: formData.get("nextService") as string,
      nextHydrostaticTestDate: formData.get("nextHydrostatic") as string,
      status: formData.get("status") as string || "Operativo",
      updatedAt: new Date().toISOString()
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "client_equipment", editingItem.id), equipmentData)
      toast({ title: "Ficha Técnica Actualizada" })
    } else {
      const newItem = { ...equipmentData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "client_equipment"), newItem)
      toast({ title: "Equipo Registrado con Éxito" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este registro de forma permanente? Se borrará de la hoja de vida.")) return
    deleteDocumentNonBlocking(doc(db, "client_equipment", id))
    toast({ variant: "destructive", title: "Activo removido de la base" })
  }

  const filteredEquipment = equipment?.filter(item => {
    const client = clients?.find(c => c.id === item.clientId)
    return item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  }).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 uppercase text-primary">Gestión de Extintores (NTP)</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase text-[10px] tracking-[0.2em]">Registro técnico y trazabilidad para protocolos de seguridad.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1c1c1c] text-white h-11 font-black uppercase text-xs shadow-xl border-b-4 border-primary">
              <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
            <form onSubmit={handleSaveEquipment}>
              <DialogHeader className="p-8 bg-slate-50 border-b">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="uppercase font-black text-primary text-xl tracking-tighter">Ficha Técnica de Equipo</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Requisito previo para emisión de certificados.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-8 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cliente Propietario</Label>
                    <Select name="clientId" defaultValue={editingItem?.clientId} required>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue placeholder="Seleccione Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Dispositivo</Label>
                    <Select name="type" defaultValue={editingItem?.type || "Extintor"}>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extintor">Extintor</SelectItem>
                        <SelectItem value="Gabinete">Gabinete contra Incendio</SelectItem>
                        <SelectItem value="Manguera">Manguera / Pitón</SelectItem>
                        <SelectItem value="Detector">Detector de Humo</SelectItem>
                        <SelectItem value="Emergencia">Luz de Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">N° Serie / Placa NTP</Label>
                    <Input name="serialNumber" defaultValue={editingItem?.serialNumber} required className="h-12 font-mono font-black border-2 border-primary/20 text-primary" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Marca / Fabricante</Label>
                    <Input name="brand" defaultValue={editingItem?.brand} className="h-12 font-bold border-2" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Agente Extintor</Label>
                    <Select name="agent" defaultValue={editingItem?.extinguishingAgent || "PQS"}>
                      <SelectTrigger className="h-12 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PQS">PQS (ABC)</SelectItem>
                        <SelectItem value="CO2">CO2 (Dióxido de Carbono)</SelectItem>
                        <SelectItem value="Agua">Agua (H2O)</SelectItem>
                        <SelectItem value="Acetato">Acetato de Potasio (K)</SelectItem>
                        <SelectItem value="Halotron">Halotrón / Clean Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidad (kg/lb)</Label>
                    <Input name="capacity" defaultValue={editingItem?.capacity} placeholder="Ej. 6kg / 10lb" className="h-12 font-bold border-2 text-center" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ubicación en Instalaciones</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input name="location" defaultValue={editingItem?.location} placeholder="Ej. Pasillo Principal, Almacén Central" className="h-12 pl-10 font-bold border-2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Año Fab.</Label>
                    <Input name="year" type="number" defaultValue={editingItem?.manufacturingYear || new Date().getFullYear()} className="h-12 font-black text-center border-2" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Última Recarga</Label>
                    <Input name="lastService" type="date" defaultValue={editingItem?.lastServiceDate || format(new Date(), "yyyy-MM-dd")} className="h-12 font-bold border-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-accent tracking-widest">Vencimiento Anual</Label>
                    <Input name="nextService" type="date" defaultValue={editingItem?.nextServiceDate} className="h-12 font-black border-2 border-accent/30 text-accent" required />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Próxima Prueba Hidrostática (5 Años)</Label>
                    <Input name="nextHydrostatic" type="date" defaultValue={editingItem?.nextHydrostaticTestDate} className="h-12 font-black border-2 border-blue-200 text-blue-600" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado de Operatividad</Label>
                  <Select name="status" defaultValue={editingItem?.status || "Operativo"}>
                    <SelectTrigger className="h-12 border-2 font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operativo">OPERATIVO (CONFORME)</SelectItem>
                      <SelectItem value="Mantenimiento">EN MANTENIMIENTO</SelectItem>
                      <SelectItem value="Vencido">VENCIDO / RECARGA PENDIENTE</SelectItem>
                      <SelectItem value="Baja">BAJA DEFINITIVA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t">
                <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98]">
                  {editingItem ? "Actualizar Hoja de Vida" : "Confirmar Registro Técnico"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary overflow-hidden">
          <CardHeader className="pb-2 bg-slate-50/50">
            <CardTitle className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" /> Inventario General
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-primary tracking-tighter">{equipment?.length || 0}</div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Unidades en sistema</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-success overflow-hidden">
          <CardHeader className="pb-2 bg-status-success/5">
            <CardTitle className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-status-success" /> Aptos Certificación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-status-success tracking-tighter">{equipment?.filter(e => e.status === "Operativo").length || 0}</div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Estado conforme</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-error overflow-hidden">
          <CardHeader className="pb-2 bg-status-error/5">
            <CardTitle className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-status-error" /> Recargas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-status-error tracking-tighter">
              {equipment?.filter(e => e.status === "Vencido" || (e.nextServiceDate && !isAfter(parseISO(e.nextServiceDate), new Date()))).length || 0}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Vencimiento anual</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-blue-600 overflow-hidden">
          <CardHeader className="pb-2 bg-blue-50">
            <CardTitle className="text-[9px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <Droplets className="h-3 w-3 text-blue-600" /> Vto. Prueba H. (5A)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-blue-600 tracking-tighter">
              {equipment?.filter(e => e.nextHydrostaticTestDate && !isAfter(parseISO(e.nextHydrostaticTestDate), new Date())).length || 0}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Presión requerida</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden bg-white">
        <CardHeader className="pb-4 border-b bg-white p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="BUSCAR POR SERIE, CLIENTE O UBICACIÓN..." 
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
            <Table className="dense-table min-w-[1200px]">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px] py-4">Serie / Identificador</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Propietario</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Ficha Técnica</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado Operativo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-center">Vto. Anual</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-center">Vto. P.H. (5A)</TableHead>
                  <TableHead className="text-white text-right pr-8 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment?.map((item) => {
                  const client = clients?.find(c => c.id === item.clientId)
                  const isExpired = item.nextServiceDate && !isAfter(parseISO(item.nextServiceDate), new Date())
                  const isPHExpired = item.nextHydrostaticTestDate && !isAfter(parseISO(item.nextHydrostaticTestDate), new Date())
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center border-2",
                            item.status === "Operativo" ? "bg-status-success/5 border-status-success/20 text-status-success" : "bg-slate-50 border-slate-200 text-slate-400"
                          )}>
                            <Flame className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-primary uppercase text-[11px] leading-none mb-1">{item.serialNumber}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">FAB: {item.manufacturingYear}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-[10px] uppercase truncate max-w-[200px]">{client?.name || "SIN ASIGNAR"}</span>
                          <span className="text-[9px] text-slate-400 flex items-center gap-1 uppercase font-bold">
                            <MapPin className="h-2.5 w-2.5" /> {item.location || "---"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-[10px] font-black text-slate-600 uppercase">
                          <span>{item.type} • {item.brand}</span>
                          <Badge variant="outline" className="text-[8px] mt-1 w-fit font-black bg-slate-50">
                            {item.extinguishingAgent || "PQS"} • {item.capacity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase px-3 py-1 rounded-md",
                          item.status === "Operativo" ? "bg-status-success text-white" : 
                          item.status === "Vencido" ? "bg-status-error text-white animate-pulse" :
                          "bg-slate-200 text-slate-600"
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={cn(
                            "text-[11px] font-black tracking-tighter px-2 py-1 rounded",
                            isExpired ? "text-status-error bg-status-error/5 border border-status-error/20" : "text-status-success font-bold"
                          )}>
                            {item.nextServiceDate ? format(parseISO(item.nextServiceDate), "dd MMM yyyy", { locale: es }).toUpperCase() : "---"}
                          </span>
                          {isExpired && <span className="text-[7px] font-black text-status-error uppercase mt-1">¡VENCIDO!</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={cn(
                            "text-[11px] font-black tracking-tighter px-2 py-1 rounded",
                            isPHExpired ? "text-blue-600 bg-blue-50 border border-blue-200" : "text-slate-500 font-bold"
                          )}>
                            {item.nextHydrostaticTestDate ? format(parseISO(item.nextHydrostaticTestDate), "dd MMM yyyy", { locale: es }).toUpperCase() : "---"}
                          </span>
                          {isPHExpired && <span className="text-[7px] font-black text-blue-600 uppercase mt-1">¡PH REQ!</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => { setEditingItem(item); setIsAdding(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredEquipment?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-32 opacity-20">
                      <HardDrive className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">Sin registros de equipos</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-white shadow-2xl border-none rounded-[2rem] overflow-hidden relative">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-top"></div>
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-8">
            <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Factory className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Hoja de Vida Técnica EXTINPRO</h3>
              <p className="text-sm opacity-70 font-bold uppercase text-[11px] tracking-wider max-w-xl">
                Gestión automatizada de Recargas (Anuales) y Pruebas Hidrostáticas (5 años). Garantizamos el cumplimiento estricto de la normativa NTP 350.043-1.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className="bg-accent text-white px-6 py-2 rounded-full shadow-lg">Motor de Cumplimiento v3.0</Badge>
            <p className="text-[8px] font-black uppercase opacity-40 mr-4">Seguridad Industrial Certificada</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
