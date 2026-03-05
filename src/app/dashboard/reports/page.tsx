
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Download, Filter, TrendingUp, DollarSign, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

const dataMonthly = [
  { month: 'Ene', servicios: 120, ingresos: 4500 },
  { month: 'Feb', servicios: 150, ingresos: 5200 },
  { month: 'Mar', servicios: 180, ingresos: 6100 },
  { month: 'Abr', servicios: 220, ingresos: 7800 },
  { month: 'May', servicios: 200, ingresos: 7200 },
  { month: 'Jun', servicios: 250, ingresos: 9500 },
]

const dataServiceType = [
  { name: 'Extintores', value: 400 },
  { name: 'Fumigación', value: 300 },
  { name: 'Inspección', value: 150 },
  { name: 'Otros', value: 50 },
]

const COLORS = ['#1a2b3c', '#d9534f', '#5cb85c', '#f0ad4e']

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">REPORTES Y ANALÍTICA</h2>
          <p className="text-muted-foreground text-sm">Visualización del desempeño operativo y financiero.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9">
            <Filter className="mr-2 h-4 w-4" /> Periodo
          </Button>
          <Button className="bg-primary text-white h-9">
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Ingresos Totales (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-1" />
              $12,450.00
            </div>
            <div className="flex items-center text-[11px] text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.5% vs mes anterior
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Servicios Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-1" />
              342
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Meta mensual: 400</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Retención de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">98.2%</div>
            <div className="text-[11px] text-muted-foreground mt-1">Basado en renovaciones anuales</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase">Servicios e Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataMonthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar dataKey="servicios" fill="#1a2b3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase">Distribución por Tipo de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataServiceType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataServiceType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="hidden sm:block space-y-2 pr-10">
              {dataServiceType.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-[10px] font-bold uppercase">
                  <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-muted-foreground mr-2">{entry.name}:</span>
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
