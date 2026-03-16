
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CalendarDays, 
  Clock, 
  User, 
  Plus,
  Loader2,
  Trash2,
  Edit2,
  PlayCircle,
  CheckCircle2,
  FileCheck
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
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAdding, setIsAdding] = useState(false)
  const [editingApt, setEditingApt] = useState<any | null>(null)

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const aptsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "appointments"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: allAppointments, isLoading: loadingApts } = useCollection(aptsRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const technicians = profiles?.filter(p => p.companyId === companyId)

  const selectedDateStr = date ? format(date, "yyyy-MM-dd") : ""
  
  // FIX: Se añadió validación de existencia para 'time' antes de llamar a localeCompare para evitar errores en tiempo de ejecución
  const dailyAppointments = [...(allAppointments?.filter(apt => apt.date === selectedDateStr) || [])].sort((a, b) => {
    const timeA = a.time || "00:00"
    const timeB = b.time || "00:00"
    return timeA.localeCompare(timeB)
  })

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

  const handleStartService = (aptId: string) => {
    router.push(`/dashboard/execution/${aptId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Programación y Ejecución</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase text-[10px]">Monitoree y ejecute los servicios técnicos de campo.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingApt(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nueva Cita
            </Button>
          </DialogTrigger>
          {/* MEJORA: Se añadió max-h y overflow para garantizar que el formulario sea desplazable en pantallas pequeñas */}
          <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
            <form onSubmit={handleSaveAppointment} className="flex flex-col h-full">
              <DialogHeader className="p-6 border-b bg-slate-50">
                <DialogTitle className="uppercase font-black text-primary">
                  {editingApt ? "Editar Cita" : "Programar Nuevo Servicio"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Asigne visitas técnicas para su organización.</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <div className="grid gap-2">
                  <Label htmlFor="clientId" className="text-[10px] font-bold uppercase text-slate-500">Cliente</Label>
                  <Select name="clientId" defaultValue={editingApt?.clientId} required>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="serviceType" className="text-[10px] font-bold uppercase text-slate-500">Tipo</Label>
                    <Select name="serviceType" defaultValue={editingApt?.serviceType || "Fumigación"} required>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extintores">Recarga Extintores</SelectItem>
                        <SelectItem value="Fumigación">Fumigación</SelectItem>
                        <SelectItem value="Inspección">Inspección Técnica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-[10px] font-bold uppercase text-slate-500">Estado</Label>
                    <Select name="status" defaultValue={editingApt?.status || "Pendiente"} required>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="En Progreso">En Progreso</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="technicianId" className="text-[10px] font-bold uppercase text-slate-500">Técnico Responsable</Label>
                  <Select name="technicianId" defaultValue={editingApt?.technicianId} required>
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue placeholder="Seleccione técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-[10px] font-bold uppercase text-slate-500">Fecha</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingApt?.date || selectedDateStr} className="h-11 border-2 font-bold" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time" className="text-[10px] font-bold uppercase text-slate-500">Hora</Label>
                    <Input id="time" name="time" type="time" defaultValue={editingApt?.time || "09:00"} className="h-11 border-2 font-bold" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-[10px] font-bold uppercase text-slate-500">Notas Adicionales</Label>
                  <Input id="notes" name="notes" defaultValue={editingApt?.notes} placeholder="Indicaciones para el técnico..." className="h-11 border-2 font-bold" />
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50">
                <Button type="submit" className="w-full uppercase font-black text-xs h-12 shadow-xl bg-primary text-white">
                  {editingApt ? "Actualizar Datos" : "Confirmar y Agendar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Calendario de Operaciones</CardTitle>
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

        <Card className="lg:col-span-7 shadow-sm border-none bg-white">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-xs font-black uppercase flex items-center tracking-widest text-primary">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              Ruta del día: {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }).toUpperCase() : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {loadingApts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dailyAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center opacity-40">
                <CalendarDays className="h-12 w-12 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">No hay servicios programados para hoy</p>
              </div>
            ) : (
              dailyAppointments.map((apt) => (
                <div key={apt.id} className={cn(
                  "relative pl-4 border-l-4 bg-background/50 p-4 rounded-r-lg border border-border transition-all hover:bg-white hover:shadow-md",
                  apt.status === "Completado" ? "border-l-status-success" : "border-l-primary"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase text-primary tracking-tight">{apt.clientName}</span>
                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50">
                          {apt.serviceType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-muted-foreground font-bold uppercase">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-accent" /> {apt.time}</span>
                        <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {apt.technicianName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status !== "Completado" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[10px] font-black uppercase bg-accent text-white hover:bg-accent/90 border-none shadow-md px-4"
                          onClick={() => handleStartService(apt.id)}
                        >
                          <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Atender
                        </Button>
                      )}
                      {apt.status === "Completado" && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-[10px] font-black uppercase text-status-success hover:bg-status-success/5"
                          onClick={() => router.push(`/dashboard/certificates?id=${apt.id}`)}
                        >
                          <FileCheck className="mr-1.5 h-3.5 w-3.5" /> Certificado
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEdit(apt)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(apt.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
