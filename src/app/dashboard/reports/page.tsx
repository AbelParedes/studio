
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Download, Filter, TrendingUp, Activity, Users, Loader2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

const COLORS = ['#1a2b3c', '#d9534f', '#5cb85c', '#f0ad4e']

export default function ReportsPage() {
  const db = useFirestore()
  const { user } = useUser()

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const appointmentsQuery = useMemoFirebase(() => 
    companyId ? query(collection(db, "appointments"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsQuery)

  const clientsQuery = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsQuery)

  const inventoryQuery = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: inventory } = useCollection(inventoryQuery)

  const chartData = useMemo(() => {
    if (!appointments) return { monthly: [], serviceTypes: [] }

    const monthlyMap = new Map()
    appointments.forEach(apt => {
      if (!apt.date) return
      const monthKey = format(parseISO(apt.date), "MMM", { locale: es })
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1)
    })

    const monthly = Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      servicios: count,
      ingresos: count * 150
    })).slice(-6)

    const typesMap = new Map()
    appointments.forEach(apt => {
      // Normalizar nombres para evitar categorías antiguas
      let type = apt.serviceType || "Otros"
      if (type.toLowerCase().includes("fumigación")) return; // Ignorar datos antiguos
      typesMap.set(type, (typesMap.get(type) || 0) + 1)
    })

    const serviceTypes = Array.from(typesMap.entries()).map(([name, value]) => ({
      name,
      value
    }))

    return { monthly, serviceTypes }
  }, [appointments])

  const stats = {
    totalClients: clients?.length || 0,
    totalServices: appointments?.length || 0,
    completedServices: appointments?.filter(a => a.status === "Completado").length || 0,
    estimatedRevenue: (appointments?.filter(a => a.status === "Completado").length || 0) * 150
  }

  if (loadingApts || loadingClients) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generando Analítica en Tiempo Real...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Reportes y Analítica</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase text-[10px] tracking-widest">Desempeño operativo exclusivo de su organización en Perú.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-[11px] font-bold uppercase border-2">
            <Filter className="mr-2 h-4 w-4" /> Periodo
          </Button>
          <Button className="bg-primary text-white h-9 text-[11px] font-bold uppercase shadow-lg">
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ingresos Estimados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black flex items-center">
              <span className="text-status-success mr-2 text-xl font-bold">S/</span>
              {stats.estimatedRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] text-status-success mt-1 font-bold uppercase">
              <TrendingUp className="h-3 w-3 mr-1" /> Meta: S/ 20,000
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black flex items-center text-primary">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              {stats.totalClients}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Base de datos técnica</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Servicios NTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black flex items-center text-status-success">
              <Activity className="h-5 w-5 mr-2" />
              {stats.completedServices}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Efectividad del equipo</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Flota Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-accent">
              {inventory?.length || 0}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Equipos registrados</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Desempeño Operativo Mensual</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            {chartData.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="servicios" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-30">
                Sin datos suficientes para proyectar
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Distribución por Servicio NTP</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center pt-6">
            {chartData.serviceTypes.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={chartData.serviceTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {chartData.serviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {chartData.serviceTypes.map((entry, index) => (
                    <div key={entry.name} className="flex items-center text-[10px] font-black uppercase">
                      <div className="h-2.5 w-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-muted-foreground mr-1">{entry.name}:</span>
                      <span className="text-primary">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-30">
                Agende servicios para visualizar distribución
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1c1c1c] text-white shadow-2xl border-none rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-top"></div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Building2 className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter">Analítica de Gestión EXTINPRO</h3>
              <p className="text-[11px] opacity-70 font-bold uppercase tracking-wider">
                Visualizando el desempeño técnico y cumplimiento normativo de su organización.
              </p>
            </div>
          </div>
          <div className="text-[10px] uppercase font-black text-accent bg-white px-6 py-2 rounded-full shadow-xl border-b-2 border-accent">
            EXTINPRO Analytica v3.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
