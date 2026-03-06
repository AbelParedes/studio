
"use client"

import { useState } from "react"
import { automatedServiceReminder, type AutomatedServiceReminderOutput } from "@/ai/flows/automated-service-reminder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Sparkles, Send, CheckCircle, Loader2, Search, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, getDocs, query, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function RemindersPage() {
  const db = useFirestore()
  const [isScanning, setIsScanning] = useState(false)
  const [reminders, setReminders] = useState<AutomatedServiceReminderOutput['reminders']>([])

  // Fetch clients to have a base for scanning
  const clientsRef = useMemoFirebase(() => collection(db, "clients"), [db])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const handleGenerateReminders = async () => {
    if (!clients || clients.length === 0) {
      toast({ title: "Sin clientes", description: "No hay clientes registrados para analizar." })
      return
    }

    setIsScanning(true)
    setReminders([])

    try {
      const allGeneratedReminders: AutomatedServiceReminderOutput['reminders'] = []
      
      // Limit to first 5 clients for speed in this prototype
      const scanLimit = clients.slice(0, 5)

      for (const client of scanLimit) {
        // Fetch appointments for this client
        const appointmentsRef = collection(db, "clients", client.id, "serviceAppointments")
        const snapshot = await getDocs(query(appointmentsRef, limit(10)))
        const history = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            date: data.scheduledDateTime?.split('T')[0] || "2024-01-01",
            type: (data.serviceTypeId === "fumigation" ? "fumigation_follow_up" : "extinguisher_maintenance") as any,
            description: data.notes || "Servicio rutinario",
            nextRecommendedDate: data.nextServiceRecommendedDate || undefined,
            lastTechnicianNotes: data.notes || undefined
          }
        })

        if (history.length > 0) {
          const result = await automatedServiceReminder({
            clientName: client.name,
            serviceLocation: client.billingAddressLine1 || "Ubicación principal",
            serviceHistory: history,
            currentDate: new Date().toISOString().split('T')[0]
          })
          allGeneratedReminders.push(...result.reminders)
        }
      }

      setReminders(allGeneratedReminders)
      if (allGeneratedReminders.length === 0) {
        toast({ title: "Escaneo completado", description: "No se detectaron servicios urgentes." })
      } else {
        toast({ title: "Recordatorios generados", description: `Se han identificado ${allGeneratedReminders.length} necesidades de servicio.` })
      }
    } catch (error) {
      console.error("AI Reminders failed", error)
      toast({ variant: "destructive", title: "Error de IA", description: "No se pudieron generar los recordatorios." })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center text-primary">
            RECORDATORIOS AI <Sparkles className="ml-2 h-5 w-5 text-accent animate-pulse" />
          </h2>
          <p className="text-muted-foreground text-sm">
            Análisis proactivo de historiales para detectar mantenimientos vencidos o próximos.
          </p>
        </div>
        <Button 
          onClick={handleGenerateReminders} 
          disabled={isScanning || loadingClients}
          className="bg-accent hover:bg-accent/90 text-white font-bold uppercase text-[11px] h-9"
        >
          {isScanning ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando Historiales...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Escanear Clientes</>
          )}
        </Button>
      </div>

      {reminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((reminder, idx) => (
            <Card key={idx} className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow bg-white overflow-hidden">
              <CardHeader className="pb-2 bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className={cn(
                    "text-[10px] uppercase font-bold",
                    reminder.priority === "high" && "bg-status-error/10 text-status-error border-status-error/20",
                    reminder.priority === "medium" && "bg-status-warning/10 text-status-warning border-status-warning/20",
                    reminder.priority === "low" && "bg-status-success/10 text-status-success border-status-success/20",
                  )}>
                    Prioridad {reminder.priority}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Vence: {reminder.dueDate}</span>
                </div>
                <CardTitle className="text-sm font-bold text-primary truncate uppercase">
                  {reminder.serviceType === "extinguisher_maintenance" ? "Mantenimiento Extintores" : "Seguimiento Fumigación"}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-medium truncate">{reminder.clientName}</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="p-3 bg-accent/5 rounded border border-accent/10 text-[12px] leading-relaxed italic text-[#333]">
                  "{reminder.reminderMessage}"
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-primary text-white h-8 text-[11px] font-bold uppercase">
                    <Send className="mr-1.5 h-3 w-3" /> Enviar Aviso
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold uppercase">
                    <CheckCircle className="mr-1.5 h-3 w-3" /> Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="py-20 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold uppercase text-primary">Sin Recordatorios Generados</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
              Presione el botón "Escanear Clientes" para que la IA analice los historiales de servicio y detecte necesidades automáticas.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Motor de IA Predictivo</h3>
              <p className="text-sm opacity-80">
                Analizando patrones de servicio para maximizar la seguridad de sus clientes.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-3 py-1 rounded-full">
            Servifumiga Pro AI v1.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
