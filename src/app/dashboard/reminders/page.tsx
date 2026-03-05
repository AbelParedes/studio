import { automatedServiceReminder } from "@/ai/flows/automated-service-reminder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Sparkles, Send, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function RemindersPage() {
  // Mock input for the AI flow
  const aiInput = {
    clientName: "Plaza Central Commercial Center",
    serviceLocation: "Avenida Central #45, Edificio Principal",
    serviceHistory: [
      {
        date: "2023-05-15",
        type: "extinguisher_maintenance" as const,
        description: "Recarga anual de 25 extintores PQS y 5 de CO2.",
        nextRecommendedDate: "2024-05-15",
        lastTechnicianNotes: "Varios equipos presentan desgaste en mangueras, se recomienda cambio en la próxima visita."
      },
      {
        date: "2024-02-10",
        type: "fumigation_follow_up" as const,
        description: "Control preventivo de plagas rastreras en área de comida.",
        nextRecommendedDate: "2024-03-10",
        lastTechnicianNotes: "Se observó actividad mínima. Reforzar cebaderos exteriores."
      }
    ],
    currentDate: "2024-03-01"
  }

  const { reminders } = await automatedServiceReminder(aiInput)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center">
            RECORDATORIOS AI <Sparkles className="ml-2 h-5 w-5 text-accent animate-pulse" />
          </h2>
          <p className="text-muted-foreground text-sm">
            Análisis inteligente de historial para detección proactiva de necesidades.
          </p>
        </div>
        <Button variant="outline" className="h-9 border-accent text-accent hover:bg-accent hover:text-white">
          <Bell className="mr-2 h-4 w-4" /> Configurar Automatización
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.length > 0 ? (
          reminders.map((reminder, idx) => (
            <Card key={idx} className="shadow-md border-t-4 border-t-accent hover:shadow-lg transition-shadow bg-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className={cn(
                    "text-[10px] uppercase font-bold",
                    reminder.priority === "high" && "bg-status-error/10 text-status-error border-status-error/20",
                    reminder.priority === "medium" && "bg-status-warning/10 text-status-warning border-status-warning/20",
                    reminder.priority === "low" && "bg-status-success/10 text-status-success border-status-success/20",
                  )}>
                    Prioridad {reminder.priority}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Due: {reminder.dueDate}</span>
                </div>
                <CardTitle className="text-sm font-bold text-primary truncate uppercase">
                  {reminder.serviceType === "extinguisher_maintenance" ? "Mantenimiento Extintores" : "Seguimiento Fumigación"}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-medium truncate">{reminder.clientName}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-background rounded border border-border text-[12px] leading-relaxed italic text-[#333]">
                  "{reminder.reminderMessage}"
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-primary text-white h-8 text-[11px]">
                    <Send className="mr-1.5 h-3 w-3" /> Enviar Aviso
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-[11px]">
                    <CheckCircle className="mr-1.5 h-3 w-3" /> Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <Bell className="h-12 w-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold">No hay recordatorios pendientes</h3>
            <p className="text-muted-foreground text-sm">La IA no ha detectado servicios próximos a vencer en los próximos 60 días.</p>
          </div>
        )}
      </div>

      <Card className="bg-primary text-white">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase">Análisis Predictivo Activado</h3>
              <p className="text-sm opacity-80">Nuestro motor de IA está procesando 450 registros de servicio para optimizar sus rutas de mañana.</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-primary">
            Ver Reporte de Eficiencia
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
