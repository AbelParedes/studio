
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  Plus,
  Loader2,
  Trash2,
  Edit2,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CalendarPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAdding, setIsAdding] = useState(false)
  const [editingApt, setEditingApt] = useState<any | null>(null)

  // Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // Filtrar citas por empresa
  const aptsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "appointments"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: allAppointments, isLoading: loadingApts } = useCollection(aptsRef)

  // Filtrar clientes por empresa
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // Filtrar técnicos por empresa
  const techsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "company_users"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: technicians } = useCollection(techsRef)

  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : ""
  
  // Daily appointments ordered by time
  const dailyAppointments = [...(allAppointments?.filter(apt => apt.date === selectedDateStr) || [])].sort((a, b) => a.time.localeCompare(b.time))

  const handleSaveAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    
    const clientId = formData.get("clientId") as string
    const client = clients?.find(c => c.id === clientId)
    const techId = formData.get("technicianId") as string
    const tech = technicians?.find(t => t.id === techId)

    const aptData = {
      companyId: companyId,
      clientId,
      clientName: client?.name || "Desconocido",
      serviceType: formData.get("serviceType") as string,
      technicianId: techId,
      technicianName: tech?.name || "Sin asignar",
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      status: formData.get("status") as string || "Pendiente",
      notes: formData.get("notes") as string,
    }

    if (editingApt) {
      updateDocumentNonBlocking(doc(db, "appointments", editingApt.id), aptData)
      toast({ title: "Cita actualizada" })
    } else {
      const newApt = { ...aptData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "appointments"), newApt)
      toast({ title: "Cita programada" })
    }

    setIsAdding(false)
    setEditingApt(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "appointments", id))
    toast({ variant: "destructive", title: "Cita cancelada" })
  }

  const openEdit = (apt: any) => {
    setEditingApt(apt)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Programación y Despacho</h2>
          <p className="text-muted-foreground text-sm">Controle la agenda exclusiva de servicios de su empresa.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingApt(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveAppointment}>
              <DialogHeader>
                <DialogTitle>{editingApt ? "Editar Cita" : "Programar Nuevo Servicio"}</DialogTitle>
                <DialogDescription>Asigne visitas técnicas para su organización.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientId" className="text-xs font-bold uppercase">Cliente</Label>
                  <Select name="clientId" defaultValue={editingApt?.clientId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="serviceType" className="text-xs font-bold uppercase">Tipo</Label>
                    <Select name="serviceType" defaultValue={editingApt?.serviceType || "Fumigación"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extintores">Recarga Extintores</SelectItem>
                        <SelectItem value="Fumigación">Fumigación</SelectItem>
                        <SelectItem value="Inspección">Inspección</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-xs font-bold uppercase">Estado</Label>
                    <Select name="status" defaultValue={editingApt?.status || "Pendiente"} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="technicianId" className="text-xs font-bold uppercase">Técnico Responsable</Label>
                  <Select name="technicianId" defaultValue={editingApt?.technicianId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-xs font-bold uppercase">Fecha</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingApt?.date || selectedDateStr} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time" className="text-xs font-bold uppercase">Hora</Label>
                    <Input id="time" name="time" type="time" defaultValue={editingApt?.time || "09:00"} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingApt ? "Actualizar" : "Agendar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase">Calendario Operativo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full border rounded-lg overflow-hidden bg-white shadow-inner p-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={es}
                className="rounded-md w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              Agenda del día: {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }).toUpperCase() : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingApts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dailyAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <p className="text-sm font-bold uppercase">No hay citas para esta fecha</p>
              </div>
            ) : (
              dailyAppointments.map((apt) => (
                <div key={apt.id} className="relative pl-4 border-l-4 border-l-primary bg-background/50 p-4 rounded-r-lg border border-border transition-all hover:bg-white hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase text-primary">{apt.clientName}</span>
                        <Badge variant="outline" className="text-[9px] font-bold">{apt.serviceType}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {apt.time}</span>
                        <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {apt.technicianName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] font-bold">{apt.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(apt)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(apt.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
