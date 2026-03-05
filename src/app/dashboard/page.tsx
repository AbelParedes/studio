import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Users, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Bell
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const stats = [
    { title: "Clientes Activos", value: "1,284", icon: Users, color: "text-blue-600" },
    { title: "Servicios hoy", value: "24", icon: CheckCircle2, color: "text-green-600" },
    { title: "Extintores por Vencer", value: "12", icon: AlertTriangle, color: "text-status-warning" },
    { title: "Próximos 7 días", value: "86", icon: Clock, color: "text-status-success" },
  ]

  const recentServices = [
    { id: "S-1024", client: "Plaza Central", type: "Recarga Extintores", status: "Completado", date: "Hace 2h" },
    { id: "S-1025", client: "Bodega Logística", type: "Fumigación Control", status: "En Proceso", date: "Hace 1h" },
    { id: "S-1026", client: "Restaurante El Faro", type: "Inspección Anual", status: "Pendiente", date: "Hoy 2pm" },
    { id: "S-1027", client: "Residencial Arcos", type: "Termitas Preventivo", status: "Pendiente", date: "Hoy 4pm" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">PANEL DE CONTROL</h2>
        <p className="text-muted-foreground">Bienvenido de nuevo. Aquí está el resumen operativo de hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span>+4% desde el mes pasado</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center">
              <Flame className="mr-2 h-4 w-4 text-accent" />
              SERVICIOS RECIENTES
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="dense-table">
              <TableHeader className="bg-primary hover:bg-primary">
                <TableRow>
                  <TableHead className="text-white">ID</TableHead>
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white">Tipo</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.id}</TableCell>
                    <TableCell>{service.client}</TableCell>
                    <TableCell>{service.type}</TableCell>
                    <TableCell>
                      <Badge variant={service.status === "Completado" ? "secondary" : "outline"} 
                        className={cn(
                          "text-[10px] px-2 py-0",
                          service.status === "Completado" && "bg-status-success/10 text-status-success border-status-success/20",
                          service.status === "En Proceso" && "bg-status-warning/10 text-status-warning border-status-warning/20",
                          service.status === "Pendiente" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{service.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-primary text-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center text-white">
              <Bell className="mr-2 h-4 w-4 text-accent" />
              ALERTAS DEL SISTEMA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white/10 rounded-md border border-white/20">
              <p className="text-xs font-bold uppercase mb-1">CRÍTICO: Extintores Vencidos</p>
              <p className="text-[12px] opacity-80">Hay 12 equipos en Plaza San Juan que requieren recarga inmediata.</p>
              <button className="mt-2 h-7 px-3 text-[10px] border border-white/30 text-white hover:bg-white hover:text-primary rounded-md transition-colors">
                Generar Orden
              </button>
            </div>
            <div className="p-3 bg-white/10 rounded-md border border-white/20">
              <p className="text-xs font-bold uppercase mb-1">Fumigación Pendiente</p>
              <p className="text-[12px] opacity-80">Bodega Norte requiere refuerzo de control de plagas antes del viernes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
