
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Users, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Bell,
  Loader2,
  Calendar,
  ShieldCheck
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { format, isBefore, parseISO, addDays } from "date-fns"
import { es } from "date-fns/locale"

export default function DashboardPage() {
  const db = useFirestore()
  const { user } = useUser()

  // 1. User profile
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Company data
  const companyRef = useMemoFirebase(() => 
    companyId ? doc(db, "companies", companyId) : null,
  [db, companyId])
  const { data: company } = useDoc(companyRef)

  // 3. Real data loading
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const appointmentsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "appointments"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsRef)

  const inventoryRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: inventory, isLoading: loadingInventory } = useCollection(inventoryRef)

  // 4. Statistics processing
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const next7Days = addDays(new Date(), 7)
  const next7DaysStr = format(next7Days, "yyyy-MM-dd")

  const stats = useMemo(() => {
    if (!clients || !appointments || !inventory) return null

    const todayApts = appointments.filter(a => a.date === todayStr)
    const upcoming7Days = appointments.filter(a => a.date > todayStr && a.date <= next7DaysStr)
    const criticalInventory = inventory.filter(i => {
      if (!i.nextDue) return false
      const dueDate = parseISO(i.nextDue)
      return isBefore(dueDate, next7Days)
    })

    return [
      { title: "Clientes Activos", value: clients.length.toString(), icon: Users, color: "text-blue-600" },
      { title: "Servicios Hoy", value: todayApts.length.toString(), icon: CheckCircle2, color: "text-status-success" },
      { title: "Equipos por Vencer", value: criticalInventory.length.toString(), icon: AlertTriangle, color: "text-status-warning" },
      { title: "Próximos 7 días", value: upcoming7Days.length.toString(), icon: Clock, color: "text-primary" },
    ]
  }, [clients, appointments, inventory, todayStr, next7Days, next7DaysStr])

  const recentServices = useMemo(() => {
    if (!appointments) return []
    return [...appointments]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 5)
  }, [appointments])

  const criticalAlerts = useMemo(() => {
    if (!inventory || !appointments) return []
    const alerts = []
    
    const expiredExt = inventory.filter(i => i.status === "Vencido" || (i.nextDue && isBefore(parseISO(i.nextDue), new Date())))
    if (expiredExt.length > 0) {
      alerts.push({
        title: "Extintores Vencidos",
        description: `Hay ${expiredExt.length} equipos que requieren recarga inmediata.`,
        type: "inventory"
      })
    }

    const pendingFum = appointments.filter(a => a.serviceType === "Fumigación" && a.status === "Pendiente" && a.date <= todayStr)
    if (pendingFum.length > 0) {
      alerts.push({
        title: "Fumigación Pendiente",
        description: `Tienes ${pendingFum.length} servicios de control de plagas retrasados o para hoy.`,
        type: "service"
      })
    }

    return alerts
  }, [inventory, appointments, todayStr])

  if (loadingClients || loadingApts || loadingInventory) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sincronizando Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-3">
          PANEL DE CONTROL
          <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 border-primary/20 text-primary">
            {company?.name || "SERVIFUMIGA PRO"}
          </Badge>
        </h2>
        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
          ESTADO OPERATIVO: {format(new Date(), "PPPP", { locale: es }).toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="flex items-center text-[9px] text-muted-foreground mt-1 font-bold uppercase">
                <TrendingUp className="h-3.5 w-3.5 mr-1 text-status-success" />
                <span>Datos Actualizados</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-white">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-bold flex items-center uppercase tracking-wider">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              Últimas Actividades Programadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[600px]">
              <Table className="dense-table">
                <TableHeader className="bg-primary hover:bg-primary">
                  <TableRow>
                    <TableHead className="text-white">CLIENTE</TableHead>
                    <TableHead className="text-white">SERVICIO</TableHead>
                    <TableHead className="text-white">FECHA</TableHead>
                    <TableHead className="text-white">ESTADO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentServices.length > 0 ? (
                    recentServices.map((service) => (
                      <TableRow key={service.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-primary uppercase">{service.clientName}</TableCell>
                        <TableCell className="text-[11px] font-medium">{service.serviceType}</TableCell>
                        <TableCell className="text-[11px]">{service.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" 
                            className={cn(
                              "text-[9px] uppercase font-bold px-2 py-0",
                              service.status === "Completado" && "border-status-success text-status-success bg-status-success/5",
                              service.status === "Pendiente" && "border-muted text-muted-foreground bg-muted/20",
                              service.status === "Confirmado" && "border-status-warning text-status-warning bg-status-warning/5",
                            )}
                          >
                            {service.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground uppercase text-[10px] font-bold">
                        No hay servicios registrados recientemente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-primary text-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center text-white uppercase tracking-wider">
              <Bell className="mr-2 h-4 w-4 text-accent" />
              ALERTAS DEL SISTEMA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-white/10 rounded-md border border-white/20">
                  <p className="text-xs font-bold uppercase mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-accent" />
                    {alert.title}
                  </p>
                  <p className="text-[11px] opacity-80 leading-relaxed font-medium">{alert.description}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <CheckCircle2 className="h-10 w-10 mb-2" />
                <p className="text-[10px] font-bold uppercase">Todo en orden</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-[9px] font-bold uppercase opacity-50 tracking-widest">SaaS Master Sync</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-status-success animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase">Sincronización Activa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
