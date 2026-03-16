
"use client"

import { useState, useMemo } from "react"
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
  Filter,
  Plus,
  FileText,
  Printer,
  Download,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  Briefcase,
  CalendarDays,
  Calculator,
  PackageSearch,
  Wrench
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, where, updateDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"

export default function ServiceOrdersPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number, catalogItemId?: string}[]>([])

  // 1. Perfil y Empresa
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const companyRef = useMemoFirebase(() => 
    companyId ? doc(db, "companies", companyId) : null,
  [db, companyId])
  const { data: company } = useDoc(companyRef)

  // 2. Cargar Órdenes de Servicio, Clientes y Catálogo
  const ordersRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "service_orders"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: orders, isLoading } = useCollection(ordersRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const catalogRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: catalog } = useCollection(catalogRef)

  // 3. Lógica de Numeración Correlativa
  const currentYear = new Date().getFullYear()
  const suggestedOrderNumber = useMemo(() => {
    if (!orders || orders.length === 0) return `OS-0001-${currentYear}`
    
    const yearOrders = orders.filter(o => {
      const oNum = o.orderNumber || ""
      return oNum.startsWith("OS-") && oNum.endsWith(`-${currentYear}`)
    })

    if (yearOrders.length === 0) return `OS-0001-${currentYear}`

    const numbers = yearOrders.map(o => {
      const parts = o.orderNumber.split("-")
      return parts.length === 3 ? parseInt(parts[1]) : 0
    })
    
    const maxNum = Math.max(...numbers)
    return `OS-${(maxNum + 1).toString().padStart(4, '0')}-${currentYear}`
  }, [orders, currentYear])

  const total = useMemo(() => 
    items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0),
  [items])

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSelectFromCatalog = (index: number, productId: string) => {
    const product = catalog?.find(p => p.id === productId)
    if (product) {
      const newItems = [...items]
      newItems[index] = {
        ...newItems[index],
        catalogItemId: product.id,
        description: product.description,
        unitPrice: product.sellPrice
      }
      setItems(newItems)
    }
  }

  const handleSaveOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)

    const orderData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      orderNumber: formData.get("number") as string || suggestedOrderNumber,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      items: items.map(i => ({ 
        description: i.description, 
        quantity: Number(i.quantity || 0), 
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.quantity || 0) * Number(i.unitPrice || 0),
        catalogItemId: i.catalogItemId || null
      })),
      total,
      status: "Pendiente",
      createdAt: new Date().toISOString()
    }

    const newId = crypto.randomUUID()
    addDocumentNonBlocking(collection(db, "service_orders"), { ...orderData, id: newId })
    toast({ title: "Orden de Servicio Creada" })

    setIsAdding(false)
    setItems([])
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "service_orders", id))
    toast({ variant: "destructive", title: "Orden eliminada" })
  }

  const handleSchedule = (order: any) => {
    router.push(`/dashboard/calendar?clientId=${order.clientId}&orderId=${order.id}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredOrders = orders?.filter(o => {
    const client = clients?.find(c => c.id === o.clientId)
    return o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (viewingOrder) {
    const client = clients?.find(c => c.id === viewingOrder.clientId)
    const formattedDate = viewingOrder.date 
      ? format(parseISO(viewingOrder.date), "dd/MM/yyyy") 
      : "---"

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button variant="ghost" onClick={() => setViewingOrder(null)} className="font-bold uppercase text-[10px]">
            <ArrowLeft className="mr-2 h-3 w-3" /> Volver al Listado
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold uppercase text-[10px]">
              <Printer className="mr-2 h-3 w-3" /> Imprimir
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-primary text-white font-bold uppercase text-[10px]">
              <Download className="mr-2 h-3 w-3" /> Descargar PDF
            </Button>
          </div>
        </div>

        {/* DOCUMENTO DE ORDEN DE SERVICIO */}
        <div className="proforma-container bg-white p-0 shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden text-[#1c1c1c] border print:shadow-none print:border-none print:m-0 print:w-full">
          {/* HEADER TÉCNICO - ESTILO COTIZACIÓN */}
          <div className="pt-12 px-12 pb-8 shrink-0 flex items-center justify-between">
            <div className="relative h-20 w-64">
              {(company?.headerUrl || company?.logoUrl) ? (
                <Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
              ) : (
                <div className="h-full w-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 rounded">
                  <Wrench className="h-10 w-10 text-slate-300" />
                </div>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-sm font-black text-[#1c1c1c] uppercase tracking-tighter leading-none mb-1">
                {company?.name || "SERVIFUMIGA PRO"}
              </h1>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-600">RUC: {company?.taxId || "---"}</span>
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-2">ORDEN DE SERVICIO</span>
                <div className="mt-2 bg-slate-100 text-[#1c1c1c] px-6 py-2 rounded-md font-black text-[12px] shadow-sm border-b-2 border-slate-300">
                   N° {viewingOrder.orderNumber}
                </div>
              </div>
            </div>
          </div>

          <div className="px-12 py-10 space-y-10 flex-1 bg-white">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">ENTIDAD SOLICITANTE</h3>
                  <div className="h-[1px] bg-slate-100 w-full"></div>
                </div>
                <div className="text-[11px] space-y-1 pt-1">
                  <p className="font-black uppercase text-[#1c1c1c] text-sm">{client?.name || "---"}</p>
                  <p className="text-slate-500 font-bold uppercase">RUC/DNI: {client?.taxId || "---"}</p>
                  <p className="text-slate-500 font-bold uppercase truncate">DIRECCIÓN: {client?.address || "---"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">PROGRAMACIÓN</h3>
                  <div className="h-[1px] bg-slate-100 w-full"></div>
                </div>
                <div className="text-[11px] space-y-1 pt-1 text-right">
                  <p className="font-bold text-slate-700 uppercase">FECHA DE REGISTRO: {formattedDate}</p>
                  <p className="font-bold text-slate-700 uppercase">TIPO: SERVICIO TÉCNICO ESPECIALIZADO</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 text-slate-600 border-slate-200 px-3">
                      ESTADO: {viewingOrder.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-[#1c1c1c] uppercase flex items-center gap-2 tracking-widest bg-slate-50 p-2 rounded">
                <ClipboardList className="h-4 w-4 text-slate-400" /> DETALLE DE REQUERIMIENTOS TÉCNICOS
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-center font-black uppercase w-20 border-r border-slate-200">CANT.</th>
                      <th className="p-4 text-left font-black uppercase">DESCRIPCIÓN DEL SERVICIO / PRODUCTO</th>
                      <th className="p-4 text-right font-black uppercase w-32 border-l border-slate-200">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingOrder.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-center font-bold border-r border-slate-100">{item.quantity}</td>
                        <td className="p-4 font-medium uppercase text-slate-700">{item.description}</td>
                        <td className="p-4 text-right text-slate-400 italic font-bold border-l border-slate-100">Pendiente</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-12 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl min-h-[150px]">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Observaciones de Campo / Hallazgos</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="h-px bg-slate-200 w-full mt-4"></div>
                <div className="h-px bg-slate-200 w-full mt-4"></div>
                <div className="h-px bg-slate-200 w-full mt-4"></div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-2 gap-24">
              <div className="text-center space-y-3">
                <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-300">Firma Técnico Responsable</span>
                </div>
                <p className="text-[10px] font-black uppercase text-primary">DPTO. OPERACIONES</p>
              </div>
              <div className="text-center space-y-3">
                <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-300">Conformidad del Cliente</span>
                </div>
                <p className="text-[10px] font-black uppercase text-primary">RECEPTOR AUTORIZADO</p>
              </div>
            </div>
          </div>

          <div 
            className="mt-auto shrink-0 flex flex-col items-center justify-center py-6 print-footer"
            style={{ 
              backgroundColor: company?.footerBgColor || '#f8fafc',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              borderTop: '1px solid #e2e8f0'
            } as any}
          >
            <div className="px-12 w-full flex flex-col items-center text-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-[10px] font-black text-slate-600 uppercase">
                {company?.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {company.address}</p>}
                {company?.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {company.phone}</p>}
                {company?.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {company.email}</p>}
              </div>
              <div className="mt-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" /> {company?.website || "WWW.TUEMPRESA.COM"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Operaciones: Órdenes de Servicio</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Gestión de ejecución técnica y control de campo.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setItems([]); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white h-10 font-bold uppercase text-xs px-6 shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Nueva Orden (Manual)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
              <form onSubmit={handleSaveOrder} className="flex flex-col h-full">
                <DialogHeader className="p-6 border-b bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="uppercase font-black text-primary text-xl tracking-tight leading-none">Nueva Orden de Trabajo</DialogTitle>
                      <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sugerido: {suggestedOrderNumber}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3" /> Cliente
                      </Label>
                      <Select name="clientId" required>
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map(c => (
                            <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <Tag className="h-3 w-3" /> N° de Orden
                      </Label>
                      <Input name="number" defaultValue={suggestedOrderNumber} className="h-11 uppercase font-mono font-bold border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" /> Fecha Registro
                      </Label>
                      <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-11 border-2 font-bold" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        <h3 className="text-[11px] font-black uppercase text-primary tracking-widest">Requerimientos Técnicos</h3>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase border-2">
                        <Plus className="h-3 w-3 mr-2" /> Añadir Ítem
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-slate-50 border-2 border-slate-100 relative group">
                          <div className="col-span-12 md:col-span-5 grid gap-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                              <PackageSearch className="h-3 w-3 text-primary" /> Catálogo
                            </Label>
                            <Select 
                              value={item.catalogItemId || ""} 
                              onValueChange={(val) => handleSelectFromCatalog(idx, val)}
                            >
                              <SelectTrigger className="h-10 text-[10px] font-bold bg-white border-none">
                                <SelectValue placeholder="Seleccionar del catálogo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {catalog?.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="text-[11px] font-medium">
                                    [{p.category}] {p.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-12 md:col-span-5 grid gap-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500">Descripción en OS</Label>
                            <Input 
                              value={item.description} 
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              className="h-10 text-xs font-bold bg-white border-2"
                              required
                            />
                          </div>
                          <div className="col-span-8 md:col-span-1 grid gap-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500">Cant.</Label>
                            <Input 
                              type="number"
                              min="1"
                              value={item.quantity} 
                              onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                              className="h-10 text-xs text-center font-black bg-white border-2"
                              required
                            />
                          </div>
                          <div className="col-span-4 md:col-span-1 flex justify-center">
                            <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50">
                  <div className="flex gap-4 w-full">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-12 uppercase font-black text-[10px]">
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] h-12 uppercase font-black text-xs bg-primary text-white shadow-xl">
                      Registrar Orden de Servicio
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="h-10 text-[10px] font-bold uppercase">
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
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary" onClick={() => setViewingOrder(order)}>
                            <FileText className="h-4 w-4" />
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
