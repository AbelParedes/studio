
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
  Factory
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
import { format, isAfter, parseISO } from "date-fns"

export default function ClientEquipmentPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // 1. Perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Clientes de la empresa
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // 3. Equipos de los clientes
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
      status: formData.get("status") as string || "Operativo",
      updatedAt: new Date().toISOString()
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "client_equipment", editingItem.id), equipmentData)
      toast({ title: "Equipo actualizado" })
    } else {
      const newItem = { ...equipmentData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "client_equipment"), newItem)
      toast({ title: "Activo registrado con éxito" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "client_equipment", id))
    toast({ variant: "destructive", title: "Activo eliminado de la base" })
  }

  const filteredEquipment = equipment?.filter(item => {
    const client = clients?.find(c => c.id === item.clientId)
    return item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Gestión de Extintores</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Inventario detallado y hoja de vida de equipos en campo.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveEquipment}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-primary">Ficha Técnica del Equipo</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Ingrese los datos identificadores para la hoja de vida.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Cliente Propietario</Label>
                    <Select name="clientId" defaultValue={editingItem?.clientId} required>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccione Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Tipo de Equipo</Label>
                    <Select name="type" defaultValue={editingItem?.type || "Extintor"}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extintor">Extintor</SelectItem>
                        <SelectItem value="Sensor de Humo">Sensor de Humo</SelectItem>
                        <SelectItem value="Luces de Emergencia">Luces de Emergencia</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">N° Serie / Placa</Label>
                    <Input name="serialNumber" defaultValue={editingItem?.serialNumber} required className="h-11 font-mono font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Marca</Label>
                    <Input name="brand" defaultValue={editingItem?.brand} className="h-11 font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Capacidad / Modelo</Label>
                    <Input name="capacity" defaultValue={editingItem?.capacity} placeholder="Ej. 6kg / PQS" className="h-11 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Ubicación Exacta</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input name="location" defaultValue={editingItem?.location} placeholder="Ej. Pasillo Central, Piso 2" className="h-11 pl-10 font-bold" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Estado Operativo</Label>
                    <Select name="status" defaultValue={editingItem?.status || "Operativo"}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operativo">Operativo</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Vencido">Vencido</SelectItem>
                        <SelectItem value="Baja">Baja / Retirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Año de Fabricación</Label>
                    <Input name="year" type="number" defaultValue={editingItem?.manufacturingYear || 2024} className="h-11 font-bold text-center" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Último Mantenimiento</Label>
                    <Input name="lastService" type="date" defaultValue={editingItem?.lastServiceDate || new Date().toISOString().split('T')[0]} className="h-11 font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Próximo Vencimiento</Label>
                    <Input name="nextService" type="date" defaultValue={editingItem?.nextServiceDate} className="h-11 font-bold border-accent/30" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl">
                  {editingItem ? "Actualizar Hoja de Vida" : "Crear Registro de Activo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Activos en Campo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{equipment?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-success">{equipment?.filter(e => e.status === "Operativo").length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-error">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Vencidos / Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-error">
              {equipment?.filter(e => e.status === "Vencido" || (e.nextServiceDate && !isAfter(parseISO(e.nextServiceDate), new Date()))).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Mantenimiento Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-accent">{equipment?.filter(e => e.status === "Mantenimiento").length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por N° Serie, Cliente o Ubicación..." 
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
                  <TableHead className="text-white font-black uppercase text-[10px]">ID / N° Serie</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Cliente / Ubicación</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Ficha Técnica</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Próximo Vto.</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment?.map((item) => {
                  const client = clients?.find(c => c.id === item.clientId)
                  const isExpired = item.nextServiceDate && !isAfter(parseISO(item.nextServiceDate), new Date())
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-primary uppercase tracking-tight">{item.serialNumber}</span>
                          <span className="text-[8px] font-mono opacity-50">{item.id.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-[11px] uppercase truncate max-w-[180px]">{client?.name || "---"}</span>
                          <span className="text-[9px] text-slate-400 flex items-center gap-1 uppercase">
                            <MapPin className="h-2 w-2" /> {item.location || "Sin ubicación"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-[10px] font-bold text-slate-600 uppercase">
                          <span>{item.type} • {item.brand}</span>
                          <span className="text-[9px] opacity-60">{item.capacity} • FAB: {item.manufacturingYear}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-black",
                            isExpired ? "text-status-error" : "text-status-success"
                          )}>
                            {item.nextServiceDate || "---"}
                          </span>
                          {isExpired && <AlertTriangle className="h-3 w-3 text-status-error animate-pulse" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5",
                          item.status === "Operativo" ? "bg-status-success/10 text-status-success border-status-success/20" : 
                          item.status === "Vencido" ? "bg-status-error/10 text-status-error border-status-error/20" :
                          "bg-slate-50 text-slate-600"
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingItem(item); setIsAdding(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredEquipment?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <HardDrive className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">No se han registrado equipos en campo aún</p>
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
              <Factory className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Trazabilidad Total de Activos</h3>
              <p className="text-sm opacity-80 font-medium">
                Gestione la hoja de vida de cada extintor para garantizar inspecciones exitosas y seguridad real.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase text-accent bg-white px-4 py-1.5 rounded-full shadow-lg">
            Módulo de Hoja de Vida v1.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
