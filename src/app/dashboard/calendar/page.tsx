
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
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const appointments = [
  { id: 1, client: "Plaza Central", time: "09:00 AM", type: "Extintores", tech: "A. Perez", status: "Confirmado" },
  { id: 2, client: "Restaurante El Faro", time: "11:30 AM", type: "Fumigación", tech: "C. Ruiz", status: "Confirmado" },
  { id: 3, client: "Hospital Metrop.", time: "02:00 PM", type: "Inspección", tech: "M. Soto", status: "Pendiente" },
  { id: 4, client: "Residencial Arcos", time: "04:30 PM", type: "Termitas", tech: "C. Ruiz", status: "Confirmado" },
]

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">PROGRAMACIÓN Y DESPACHO</h2>
          <p className="text-muted-foreground text-sm">Organice visitas técnicas y controle la disponibilidad de equipos.</p>
        </div>
        <Button className="bg-primary text-white h-9">
          <Plus className="mr-2 h-4 w-4" /> Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase">Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-none mx-auto scale-110"
            />
            <div className="mt-6 space-y-3">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground border-b pb-1">Técnicos Disponibles</h4>
              <div className="flex flex-wrap gap-2">
                {["Carlos Ruiz", "Andrés Perez", "Mario Soto", "Luis G."].map(tech => (
                  <Badge key={tech} variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-status-success mr-1.5"></div>
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              AGENDA DEL DÍA: {date?.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="group relative pl-4 border-l-4 border-l-primary bg-background/50 p-4 rounded-r-lg border border-border transition-all hover:bg-white hover:shadow-md cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold uppercase text-primary">{apt.client}</span>
                      <Badge className={cn(
                        "text-[9px] uppercase",
                        apt.type === "Extintores" ? "bg-accent/10 text-accent border-accent/20" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>{apt.type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {apt.time}</span>
                      <span className="flex items-center"><User className="h-3 w-3 mr-1" /> Técnico: {apt.tech}</span>
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> Ver ubicación</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={apt.status === "Confirmado" ? "secondary" : "outline"} className={cn(
                      "text-[10px] uppercase font-bold",
                      apt.status === "Confirmado" ? "bg-status-success/10 text-status-success" : "text-muted-foreground"
                    )}>{apt.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase">Detalles</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
