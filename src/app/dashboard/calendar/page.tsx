
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
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
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
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAdding, setIsAdding] = useState(false)
  const [editingApt, setEditingApt] = useState<any | null>(null)

  // Fetch all appointments
  const aptsRef = useMemoFirebase(() => collection(db, "appointments"), [db])
  const { data: allAppointments, isLoading: loadingApts } = useCollection(aptsRef)

  // Fetch clients for selection
  const clientsRef = useMemoFirebase(() => collection(db, "clients"), [db])
  const { data: clients } = useCollection(clientsRef)

  // Fetch technicians (users with specific roles)
  const techsRef = useMemoFirebase(() => collection(db, "company_users"), [db])
  const { data: technicians } = useCollection(techsRef)

  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : ""
  const dailyAppointments = allAppointments?.filter(apt => apt.date === selectedDateStr) || []

  const handleSaveAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const clientId = formData.get("clientId") as string
    const client = clients?.find(c => c.id === clientId)
    const techId = formData.get("technicianId") as string
    const tech = technicians?.find(t => t.id === techId)

    const aptData = {
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
      toast({ title: "Cita actualizada", description: "Los cambios se han guardado correctamente." })
    } else {
      const newApt = { ...aptData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(aptsRef, newApt)
      toast({ title: "Cita programada", description: `Servicio para ${aptData.clientName} registrado.` })
    }

    setIsAdding(false)
    setEditingApt(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "appointments", id))
    toast({ variant: "destructive", title: "Cita cancelada", description: "El registro ha sido eliminado." })
  }

  const openEdit = (apt: any) => {
    setEditingApt(apt)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">PROGRAMACIÓN Y DESPACHO</h2>
          <p className="text-muted-foreground text-sm">Organice visitas técnicas y controle la disponibilidad de equipos.</p>
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
                <DialogDescription>Complete los datos para la visita técnica.</DialogDescription>
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
                    <Label htmlFor="serviceType" className="text-xs font-bold uppercase">Tipo de Servicio</Label>
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
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
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

                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-xs font-bold uppercase">Notas / Observaciones</Label>
                  <Input id="notes" name="notes" defaultValue={editingApt?.notes} placeholder="Detalles del acceso..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingApt ? "Actualizar Cita" : "Agendar Servicio"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase">Calendario de Rutas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={es}
                className="rounded-md border border-muted sm:border-none p-2 sm:p-0"
              />
            </div>
            <div className="mt-6 space-y-3">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground border-b pb-1">Técnicos del Sistema</h4>
              <div className="flex flex-wrap gap-2">
                {technicians?.map(tech => (
                  <Badge key={tech.id} variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-status-success mr-1.5"></div>
                    {tech.name}
                  </Badge>
                ))}
                {(!technicians || technicians.length === 0) && (
                  <p className="text-[10px] text-muted-foreground">No hay técnicos registrados.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 shadow-sm border-none">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold uppercase flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              AGENDA DEL DÍA: {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }).toUpperCase() : "SELECCIONE FECHA"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {loadingApts ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs uppercase font-bold text-muted-foreground">Cargando agenda...</p>
              </div>
            ) : dailyAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                <CalendarDays className="h-12 w-12 opacity-10 mb-2" />
                <p className="text-sm font-bold uppercase">No hay citas programadas</p>
                <p className="text-[10px] max-w-xs mt-1">Haga clic en "Nueva Cita" para agendar un servicio técnico para este día.</p>
              </div>
            ) : (
              dailyAppointments.map((apt) => (
                <div key={apt.id} className="group relative pl-4 border-l-4 border-l-primary bg-background/50 p-3 sm:p-4 rounded-r-lg border border-border transition-all hover:bg-white hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold uppercase text-primary">{apt.clientName}</span>
                        <Badge className={cn(
                          "text-[9px] uppercase font-bold",
                          apt.serviceType === "Extintores" ? "bg-accent/10 text-accent border-accent/20" : "bg-blue-100 text-blue-700 border-blue-200"
                        )}>{apt.serviceType}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {apt.time}</span>
                        <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {apt.technicianName}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold",
                        apt.status === "Confirmado" && "bg-status-success/10 text-status-success border-status-success/20",
                        apt.status === "Completado" && "bg-blue-50 text-blue-600 border-blue-100",
                        apt.status === "Cancelado" && "bg-status-error/10 text-status-error border-status-error/20",
                        apt.status === "Pendiente" && "bg-muted text-muted-foreground"
                      )}>{apt.status}</Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(apt)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(apt.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {apt.notes && (
                    <div className="mt-2 text-[10px] italic text-muted-foreground bg-white/50 p-2 rounded border border-dashed">
                      <strong>Nota:</strong> {apt.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
