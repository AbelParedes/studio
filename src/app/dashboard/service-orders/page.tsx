
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ClipboardList, 
  Search, 
  Trash2, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  Building2,
  BadgeInfo,
  ArrowRight,
  Filter
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where, updateDoc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ServiceOrdersPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // 1. Obtener perfil y empresa
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Cargar Órdenes de Servicio
  const ordersRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "service_orders"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: orders, isLoading } = useCollection(ordersRef)

  // 3. Cargar Clientes para nombres
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "service_orders", id))
    toast({ variant: "destructive", title: "Orden eliminada" })
  }

  const handleSchedule = (order: any) => {
    // Redirigir al calendario con parámetros para pre-llenar (simulado por ahora)
    toast({ title: "Acceso a Programación", description: "Cargando datos en el calendario operativo..." })
    router.push(`/dashboard/calendar?clientId=${order.clientId}&orderId=${order.id}`)
  }

  const filteredOrders = orders?.filter(o => {
    const client = clients?.find(c => c.id === o.clientId)
    return o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Operaciones: Órdenes de Servicio</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Compromisos de ejecución técnica y control de campo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 text-[10px] font-bold uppercase">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Pendientes de Inicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {orders?.filter(o => o.status === "Pendiente").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">En Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-accent">
              {orders?.filter(o => o.status === "En Ejecución").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-success">
              {orders?.filter(o => o.status === "Finalizado").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por N° OS o Cliente..." 
              className="pl-9 h-10 text-xs font-bold uppercase" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">N° Orden</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Cliente / Solicitante</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Fecha Registro</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado Operativo</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Gestión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => {
                  const client = clients?.find(c => c.id === order.clientId)
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-primary uppercase tracking-tight">
                        <div className="flex flex-col">
                          <span>{order.orderNumber}</span>
                          <span className="text-[8px] opacity-50 font-mono">ID: {order.id.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="font-bold uppercase text-[11px]">{client?.name || "---"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-medium text-slate-500">
                        {order.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5",
                          order.status === "Finalizado" ? "bg-status-success/10 text-status-success border-status-success/20" : 
                          order.status === "En Ejecución" ? "bg-accent/10 text-accent border-accent/20" :
                          order.status === "Programado" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600"
                        )}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "Pendiente" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-[9px] font-black uppercase border-primary text-primary hover:bg-primary hover:text-white"
                              onClick={() => handleSchedule(order)}
                            >
                              <Calendar className="h-3 w-3 mr-1.5" /> Programar Visita
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <BadgeInfo className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredOrders?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <ClipboardList className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">No se detectan órdenes de servicio activas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-white shadow-xl border-none">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Control Operativo Total</h3>
              <p className="text-sm opacity-80 font-medium">
                Las Órdenes de Servicio son el nexo entre la venta y la ejecución técnica de campo.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase text-accent bg-white px-4 py-1.5 rounded-full shadow-lg">
            Módulo Operativo v4.0
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
