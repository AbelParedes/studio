"use client"

import { useState } from "react"
import { automatedServiceReminder, type AutomatedServiceReminderOutput } from "@/ai/flows/automated-service-reminder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Sparkles, Send, CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, getDocs, query, where, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function RemindersPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isScanning, setIsScanning] = useState(false)
  const [reminders, setReminders] = useState<AutomatedServiceReminderOutput['reminders']>([])

  // 1. Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Cargar Clientes de la Empresa
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const handleGenerateReminders = async () => {
    if (!companyId || !clients || clients.length === 0) {
      toast({ title: "Sin clientes", description: "No hay clientes registrados en su empresa para analizar." })
      return
    }

    setIsScanning(true)
    setReminders([])

    try {
      const allGeneratedReminders: AutomatedServiceReminderOutput['reminders'] = []
      
      // Escaneamos los primeros 10 clientes para el prototipo
      const scanLimit = clients.slice(0, 10)

      for (const client of scanLimit) {
        // Consultar citas reales para este cliente en esta empresa
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("companyId", "==", companyId),
          where("clientId", "==", client.id),
          limit(20)
        )
        
        const snapshot = await getDocs(appointmentsQuery)
        const history = snapshot.docs.map(doc => {
          const data = doc.data()
          // Mapeo de tipos para el flujo de IA
          const mappedType: "extinguisher_maintenance" | "fumigation_follow_up" = 
            data.serviceType === "Extintores" ? "extinguisher_maintenance" : "fumigation_follow_up"

          return {
            date: data.date || "2024-01-01",
            type: mappedType,
            description: data.notes || `Servicio de ${data.serviceType}`,
            nextRecommendedDate: data.nextDue || undefined,
            lastTechnicianNotes: data.notes || undefined
          }
        })

        if (history.length > 0) {
          const result = await automatedServiceReminder({
            clientName: client.name,
            serviceLocation: client.address || "Ubicación del cliente",
            serviceHistory: history,
            currentDate: new Date().toISOString().split('T')[0]
          })
          
          if (result.reminders && result.reminders.length > 0) {
            allGeneratedReminders.push(...result.reminders)
          }
        }
      }

      setReminders(allGeneratedReminders)
      if (allGeneratedReminders.length === 0) {
        toast({ title: "Escaneo completado", description: "No se detectaron necesidades urgentes en su base de datos." })
      } else {
        toast({ title: "Análisis completado", description: `Se identificaron ${allGeneratedReminders.length} oportunidades de servicio.` })
      }
    } catch (error) {
      console.error("AI Reminders failed", error)
      toast({ variant: "destructive", title: "Error de IA", description: "El motor de IA no pudo procesar los historiales." })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center text-primary uppercase">
            Recordatorios IA <Sparkles className="ml-2 h-5 w-5 text-accent animate-pulse" />
          </h2>
          <p className="text-muted-foreground text-sm">
            Análisis inteligente de su historial exclusivo para predecir mantenimientos.
          </p>
        </div>
        <Button 
          onClick={handleGenerateReminders} 
          disabled={isScanning || loadingClients || !companyId}
          className="bg-accent hover:bg-accent/90 text-white font-bold uppercase text-[11px] h-9"
        >
          {isScanning ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando Historiales...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Escanear Base de Datos</>
          )}
        </Button>
      </div>

      {reminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((reminder, idx) => (
            <Card key={idx} className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow bg-white overflow-hidden flex flex-col">
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
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Vto Sugerido: {reminder.dueDate}</span>
                </div>
                <CardTitle className="text-sm font-bold text-primary truncate uppercase tracking-tight">
                  {reminder.serviceType === "extinguisher_maintenance" ? "Mantenimiento Extintores" : "Seguimiento Fumigación"}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-bold truncate">{reminder.clientName}</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
                <div className="p-3 bg-accent/5 rounded border border-accent/10 text-[12px] leading-relaxed italic text-[#333] mb-4">
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
        <Card className="border-dashed border-2 bg-muted/5">
          <CardContent className="py-20 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-30">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold uppercase text-primary tracking-tight">Motor AI listo para escanear</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2 font-medium">
              Al presionar el botón de escaneo, la IA revisará las últimas visitas de sus clientes y generará oportunidades de venta automáticas.
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
              <h3 className="font-bold text-lg uppercase tracking-tight">Proactividad Basada en Datos</h3>
              <p className="text-sm opacity-80">
                Aumente su tasa de retorno detectando necesidades antes de que el cliente las solicite.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-bold text-accent bg-white px-3 py-1 rounded-full shadow-sm">
            Inteligencia Predictiva v1.5
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
