"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
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
  ShieldCheck,
  Coins,
  ArrowUpRight,
  HardDrive,
  FileText
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { format, isBefore, parseISO, addDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default function DashboardPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const companyRef = useMemoFirebase(() => 
    companyId ? doc(db, "companies", companyId) : null,
  [db, companyId])
  const { data: company } = useDoc(companyRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const appointmentsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "appointments"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsRef)

  const equipmentRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "client_equipment"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: equipment, isLoading: loadingEquipment } = useCollection(equipmentRef)

  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")
  const next30Days = addDays(today, 30)

  const stats = useMemo(() => {
    if (!clients || !appointments || !equipment) return null

    const todayApts = appointments.filter(a => a.date === todayStr)
    const expiredEquipment = equipment.filter(e => e.status === "Vencido" || (e.nextServiceDate && isBefore(parseISO(e.nextServiceDate), today)))
    const criticalThisMonth = equipment.filter(e => {
      if (!e.nextServiceDate) return false
      const dueDate = parseISO(e.nextServiceDate)
      return isBefore(dueDate, next30Days) && !isBefore(dueDate, today)
    })

    const potentialRevenue = (expiredEquipment.length + criticalThisMonth.length) * 150

    return [
      { title: "Ingresos en Riesgo", value: `S/ ${potentialRevenue.toLocaleString()}`, icon: Coins, color: "text-accent", desc: "Equipos por vencer (30 d)" },
      { title: "Servicios Hoy", value: todayApts.length.toString(), icon: CheckCircle2, color: "text-status-success", desc: "Visitas programadas" },
      { title: "Flota Total", value: `${equipment.length}`, icon: HardDrive, color: "text-primary", desc: `${expiredEquipment.length} vencidos` },
      { title: "Clientes Pro", value: clients.length.toString(), icon: Users, color: "text-blue-600", desc: "Cartera activa" },
    ]
  }, [clients, appointments, equipment, todayStr, next30Days])

  const recentServices = useMemo(() => {
    if (!appointments) return []
    return [...appointments]
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 5)
  }, [appointments])

  const criticalAlerts = useMemo(() => {
    if (!equipment || !appointments) return []
    const alerts = []
    
    const expiredCount = equipment.filter(e => e.status === "Vencido" || (e.nextServiceDate && isBefore(parseISO(e.nextServiceDate), today))).length
    if (expiredCount > 0) {
      alerts.push({
        title: "Vencimiento Crítico",
        description: `${expiredCount} extintores requieren gestión inmediata.`,
        type: "critical"
      })
    }

    const pendingFum = appointments.filter(a => a.serviceType === "Fumigación" && a.status === "Pendiente" && a.date <= todayStr)
    if (pendingFum.length > 0) {
      alerts.push({
        title: "Retraso Sanitario",
        description: `${pendingFum.length} servicios sin cerrar.`,
        type: "warning"
      })
    }

    return alerts
  }, [equipment, appointments, todayStr])

  if (loadingClients || loadingApts || loadingEquipment) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Sincronizando Entorno...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-primary">
            Centro de Mando
          </h2>
          <Badge className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[8px] sm:text-[9px] px-3 w-fit">
            {company?.name || "SERVIFUMIGA PRO"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-[9px] sm:text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <Calendar className="h-3 w-3" /> {format(new Date(), "PPPP", { locale: es }).toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-none bg-white hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg bg-slate-50", stat.color)}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-black text-primary tracking-tighter">{stat.value}</div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 font-bold uppercase truncate">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 p-4 sm:p-6">
            <CardTitle className="text-xs font-black flex items-center uppercase tracking-widest text-primary">
              <Clock className="mr-2 h-4 w-4 text-accent" />
              Servicios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table className="dense-table min-w-[600px] lg:min-w-full">
              <TableHeader className="bg-white hover:bg-white border-b">
                <TableRow>
                  <TableHead className="text-slate-400 font-black uppercase text-[9px] tracking-widest">Cliente</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[9px] tracking-widest">Operación</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[9px] tracking-widest">Estado</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[9px] tracking-widest text-right pr-6">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentServices.length > 0 ? (
                  recentServices.map((service) => (
                    <TableRow key={service.id} className="hover:bg-muted/30 border-slate-50">
                      <TableCell className="font-bold text-primary uppercase text-[10px] sm:text-[11px]">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[150px]">{service.clientName}</span>
                          <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase">{service.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black uppercase border-primary/10">
                          {service.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            service.status === "Completado" ? "bg-status-success" : "bg-slate-300 animate-pulse"
                          )}></div>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-600">{service.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[8px] sm:text-[9px] font-black uppercase"
                          onClick={() => router.push(service.status === "Completado" ? `/dashboard/certificates/view/${service.id}` : `/dashboard/calendar`)}
                        >
                          {service.status === "Completado" ? "Certificado" : "Ver Agenda"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground uppercase text-[10px] font-bold">
                      Sin registros actuales
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-lg border-none bg-[#1c1c1c] text-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-4">
              <CardTitle className="text-xs font-black flex items-center text-accent uppercase tracking-widest">
                <Bell className="mr-2 h-4 w-4" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[9px] font-black uppercase text-accent mb-1 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {alert.title}
                    </p>
                    <p className="text-[10px] text-white/70 font-bold uppercase leading-tight">{alert.description}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <ShieldCheck className="h-10 w-10 mb-3 text-status-success" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-center">Todo bajo control</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-accent text-white rounded-2xl">
            <CardContent className="p-6 text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto opacity-50" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight">Venta Predictiva</h3>
              <p className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase leading-tight">
                Use los Recordatorios IA para anticiparse a los vencimientos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}