
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
  Edit2
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
    if(!confirm("¿Anular esta programación?")) return
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Agenda Técnica de Extintores</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Programación de mantenimiento y recarga de equipos.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingApt(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveAppointment} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                <DialogTitle className="uppercase font-black text-primary">
                  {editingApt ? "Editar Cita" : "Programar Visita"}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Asigne recursos técnicos para extintores.</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-0">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Cliente</Label>
                  <Select name="clientId" defaultValue={editingApt?.clientId} required>
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue placeholder="Seleccione cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => (
                        <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Tipo de Trabajo</Label>
                    <Select name="serviceType" defaultValue={editingApt?.serviceType || "Mantenimiento"} required>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mantenimiento">Mantenimiento NTP</SelectItem>
                        <SelectItem value="Recarga">Recarga Anual</SelectItem>
                        <SelectItem value="Inspección">Inspección Técnica</SelectItem>
                        <SelectItem value="Venta">Venta / Entrega</SelectItem>
                        <SelectItem value="Alquiler">Alquiler de Equipos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Estado</Label>
                    <Select name="status" defaultValue={editingApt?.status || "Pendiente"} required>
                      <SelectTrigger className="h-11 border-2">
                        <SelectValue />
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
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Técnico Responsable</Label>
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
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Fecha</Label>
                    <Input name="date" type="date" defaultValue={editingApt?.date || selectedDateStr} className="h-11 border-2 font-bold" required />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Hora</Label>
                    <Input name="time" type="time" defaultValue={editingApt?.time || "09:00"} className="h-11 border-2 font-bold" required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Notas de Trabajo</Label>
                  <Input name="notes" defaultValue={editingApt?.notes} placeholder="Indicaciones técnicas..." className="h-11 border-2 font-bold" />
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                <Button type="submit" className="w-full uppercase font-black text-xs h-12 shadow-xl bg-primary text-white">
                  {editingApt ? "Guardar Cambios" : "Confirmar Programación"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 shadow-sm border-none bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Calendario de Operaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-2 sm:p-6">
            <div className="w-full border rounded-lg overflow-hidden bg-white shadow-inner p-1 max-w-full">
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
          <CardHeader className="border-b bg-slate-50/50 p-4 sm:p-6">
            <CardTitle className="text-[10px] sm:text-xs font-black uppercase flex items-center tracking-widest text-primary">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              Servicios: {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }).toUpperCase() : "---"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {loadingApts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dailyAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center opacity-40">
                <CalendarDays className="h-10 w-10 mb-3" />
                <p className="text-[9px] font-black uppercase tracking-widest">Sin servicios programados</p>
              </div>
            ) : (
              dailyAppointments.map((apt) => (
                <div key={apt.id} className={cn(
                  "relative pl-4 border-l-4 bg-slate-50/50 p-4 rounded-r-lg border transition-all hover:bg-white hover:shadow-md",
                  apt.status === "Completado" ? "border-l-status-success" : "border-l-primary"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold uppercase text-primary truncate max-w-[200px]">{apt.clientName}</span>
                        <Badge variant="outline" className="text-[8px] font-black uppercase bg-white">
                          {apt.serviceType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-accent" /> {apt.time}</span>
                        <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {apt.technicianName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {apt.status !== "Completado" ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[9px] font-black uppercase bg-accent text-white hover:bg-accent/90 border-none shadow-md px-4 flex-1 sm:flex-none"
                          onClick={() => router.push(`/dashboard/execution/${apt.id}`)}
                        >
                          Atender
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-[9px] font-black uppercase text-status-success hover:bg-status-success/5 flex-1 sm:flex-none"
                          onClick={() => router.push(`/dashboard/service-orders`)}
                        >
                          Ver OT
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEdit(apt)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(apt.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
