
"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Trash2, 
  Edit2, 
  Loader2, 
  Mail, 
  Building2,
  Phone,
  Globe,
  MapPin,
  ArrowLeft,
  MousePointer2,
  Flame
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
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
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number}[]>([])

  // Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // Filtrar cotizaciones por empresa
  const quotationsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "quotations"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: quotations, isLoading } = useCollection(quotationsRef)

  // Clientes para el formulario
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSaveQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const tax = subtotal * 0.18 // IGV 18%
    const total = subtotal + tax

    const quotationData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      quotationNumber: formData.get("number") as string || `COT-${Date.now().toString().slice(-6)}`,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      items: items.map(i => ({ ...i, total: i.quantity * i.unitPrice })),
      subtotal,
      tax,
      total,
      status: "Borrador",
      createdAt: new Date().toISOString()
    }

    if (editingQuotation) {
      updateDocumentNonBlocking(doc(db, "quotations", editingQuotation.id), quotationData)
      toast({ title: "Cotización actualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: crypto.randomUUID() })
      toast({ title: "Cotización creada" })
    }

    setIsAdding(false)
    setEditingQuotation(null)
    setItems([])
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "quotations", id))
    toast({ variant: "destructive", title: "Cotización eliminada" })
  }

  const handlePrint = () => {
    window.print()
  }

  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-xs">
            <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
          </Button>
          <Button onClick={handlePrint} className="bg-primary text-white font-bold uppercase text-xs">
            <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
          </Button>
        </div>

        {/* Formato Membretado A4 Extintores Apeva - NUEVO LOGO */}
        <div className="bg-white p-0 shadow-2xl mx-auto print-container max-w-[21cm] min-h-[29.7cm] flex flex-col relative overflow-hidden text-slate-900 border border-slate-200">
          
          {/* Header con el Estilo del Nuevo Logo */}
          <div className="pt-8 px-10 pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Logo Circular Dinámico */}
                <div className="relative h-24 w-24 shrink-0">
                  <div className="absolute inset-0 rounded-full border-[6px] border-red-600 bg-white flex items-center justify-center shadow-lg">
                    <div className="relative h-14 w-14">
                       <Flame className="absolute -left-1 -top-1 h-12 w-12 text-orange-500 opacity-80" />
                       <span className="relative z-10 text-red-600 font-black text-4xl italic flex items-center justify-center h-full">EA</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                    <Flame className="h-6 w-6 text-red-600" />
                  </div>
                </div>

                {/* Texto del Logo Estilo Apeva */}
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-700 tracking-[0.2em] leading-none mb-1">EXTINTORES</span>
                  <div className="relative">
                    <h1 className="text-6xl font-black text-red-600 tracking-tighter leading-none italic uppercase flex items-baseline gap-0">
                      APEVA
                    </h1>
                    {/* Elementos de llama decorativos simulando el logo */}
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-between px-2">
                       <Flame className="h-6 w-6 text-orange-400 fill-orange-400" />
                       <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                       <Flame className="h-7 w-7 text-red-500 fill-red-500" />
                       <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end pt-4">
                <div className="border-[4px] border-red-600 p-4 rounded-xl bg-slate-50 min-w-[200px] shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">OFICIAL</div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">R.U.C. 20602345678</p>
                  <p className="text-xs font-black uppercase text-red-600 mb-1">COTIZACIÓN</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{viewingQuotation.quotationNumber}</p>
                </div>
                <p className="text-[10px] mt-3 font-bold text-slate-500 uppercase tracking-tighter">FECHA DE EMISIÓN: {viewingQuotation.date}</p>
              </div>
            </div>
          </div>

          {/* Línea Divisoria Decorativa con Llamas */}
          <div className="px-10 mt-4">
            <div className="h-[3px] bg-red-600 w-full mb-[2px]"></div>
            <div className="h-[1px] bg-orange-400 w-full"></div>
          </div>

          {/* Cuerpo de la Cotización */}
          <div className="p-10 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-10 mb-10">
              <div className="space-y-1.5 p-5 border border-slate-200 border-l-[6px] border-l-red-600 bg-slate-50/50 rounded-r-xl">
                <p className="font-black uppercase text-slate-400 text-[9px] tracking-widest mb-2 flex items-center">
                   <MousePointer2 className="h-3 w-3 mr-1 text-red-600" />
                   DIRIGIDO A:
                </p>
                <p className="font-black text-lg uppercase text-slate-800">{client?.name || "Desconocido"}</p>
                <div className="h-px bg-slate-200 w-full my-2"></div>
                <p className="text-[11px] font-bold text-slate-700">RUC / DNI: <span className="font-mono bg-white px-1 border rounded">{client?.taxId}</span></p>
                <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-red-600" />
                  <span className="font-medium">{client?.address}</span>
                </div>
              </div>
              <div className="text-right space-y-1.5 p-5 border border-red-100 border-r-[6px] border-r-red-600 bg-red-50/20 rounded-l-xl flex flex-col justify-center">
                <p className="font-black uppercase text-red-600 text-[10px] tracking-widest">EXTINTORES APEVA SAC</p>
                <p className="text-[11px] font-bold text-slate-700 uppercase">SEDE CENTRAL LIMA NORTE</p>
                <p className="text-[10px] text-slate-500 font-medium italic">Atención Inmediata a Industrias y Comercios</p>
              </div>
            </div>

            <div className="flex-1">
              <Table className="border rounded-xl overflow-hidden border-slate-200 shadow-sm">
                <TableHeader className="bg-slate-800 hover:bg-slate-800">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-black uppercase text-[10px] tracking-wider py-5 pl-6">ITEM / DESCRIPCIÓN DEL SERVICIO</TableHead>
                    <TableHead className="text-center text-white font-black uppercase text-[10px] tracking-wider py-5 w-24">CANTIDAD</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-5 w-32">P. UNIT (S/)</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-5 w-32 pr-6">PARCIAL (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingQuotation.items.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50">
                      <TableCell className="font-bold uppercase text-[11px] py-5 pl-6 text-slate-700">
                        <div className="flex items-center gap-2">
                           <span className="h-5 w-5 rounded bg-red-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">{idx + 1}</span>
                           {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-[11px] py-5">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-[11px] py-5">{(item.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black text-[11px] py-5 text-red-600 pr-6">{(item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Filas de relleno estéticas */}
                  {viewingQuotation.items.length < 10 && Array(10 - viewingQuotation.items.length).fill(0).map((_, i) => (
                    <TableRow key={`empty-${i}`} className="h-10 border-b border-slate-50/50">
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8 flex justify-between items-end">
              <div className="w-1/2 space-y-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-[10px] font-black uppercase text-red-600 tracking-widest flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    NOTAS DE SERVICIO
                  </p>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
                    * Todos nuestros extintores cumplen con la norma NTP 350.043.<br/>
                    * Garantía de 01 año por defecto de fabricación.<br/>
                    * Entrega e instalación sin costo adicional en Lima.
                  </p>
                </div>
              </div>
              
              <div className="w-72 space-y-2 bg-slate-800 p-6 rounded-2xl shadow-xl transform translate-y-4">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-400">SUBTOTAL</span>
                  <span className="font-black text-white">S/ {(viewingQuotation.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-400">I.G.V. (18%)</span>
                  <span className="font-black text-white">S/ {(viewingQuotation.tax || 0).toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-black uppercase text-red-500 text-sm tracking-widest">TOTAL NETO</span>
                  <span className="font-black text-white text-2xl tracking-tighter">S/ {(viewingQuotation.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-20 grid grid-cols-2 gap-20">
              <div className="flex flex-col items-center">
                <div className="w-48 h-px bg-slate-400 mb-2"></div>
                <p className="text-[10px] font-black uppercase text-slate-400">ACEPTADO POR CLIENTE</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 h-px bg-red-600 mb-2"></div>
                <p className="text-[10px] font-black uppercase text-red-600">DEPARTAMENTO TÉCNICO</p>
                <p className="text-[9px] font-bold text-slate-500 italic">Extintores Apeva SAC</p>
              </div>
            </div>
          </div>

          {/* Footer Oficial - Amarillo Apeva */}
          <div className="bg-[#ffdd00] py-8 px-10 no-print-bg mt-auto border-t-4 border-red-600">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-10 w-full">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-900 bg-white/40 px-3 py-1.5 rounded-full border border-slate-900/10">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span>Av. Naranjal 215 int A 06 Independencia - Lima</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-900 bg-white/40 px-3 py-1.5 rounded-full border border-slate-900/10">
                  <Phone className="h-4 w-4 text-red-600" />
                  <span>933 261 752 / 918 790 212</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-10 w-full">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-900 bg-white/40 px-3 py-1.5 rounded-full border border-slate-900/10">
                  <Mail className="h-4 w-4 text-red-600" />
                  <span className="lowercase">extintoresapeva@hotmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-900 bg-white/40 px-3 py-1.5 rounded-full border border-slate-900/10">
                  <Globe className="h-4 w-4 text-red-600" />
                  <span className="lowercase">www.extintoresapeva.com</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-red-700 tracking-[0.4em] mt-2 opacity-60">SEGURIDAD • GARANTÍA • CONFIANZA</p>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .no-print {
                display: none;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border: none;
              }
              @page {
                size: A4;
                margin: 0;
              }
              .no-print-bg {
                background-color: #ffdd00 !important;
                -webkit-print-color-adjust: exact;
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Cotizaciones y Ventas</h2>
          <p className="text-muted-foreground text-sm">Genere presupuestos profesionales con el formato oficial Apeva.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveQuotation}>
              <DialogHeader>
                <DialogTitle>{editingQuotation ? "Editar Cotización" : "Crear Nueva Cotización"}</DialogTitle>
                <DialogDescription>Los precios se calcularán automáticamente con IGV del 18%.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase">Cliente</Label>
                    <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase">Número de Cotización</Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber} placeholder="Ej: COT-001" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase">Items del Presupuesto</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-[10px] font-bold">
                      <Plus className="h-3 w-3 mr-1" /> Añadir Item
                    </Button>
                  </div>
                  
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-muted/20">
                      <div className="col-span-6 grid gap-1">
                        <Label className="text-[9px] uppercase">Descripción</Label>
                        <Input 
                          value={item.description} 
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Mantenimiento de extintor..."
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-2 grid gap-1">
                        <Label className="text-[9px] uppercase">Cant.</Label>
                        <Input 
                          type="number"
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="h-8 text-xs text-center"
                        />
                      </div>
                      <div className="col-span-3 grid gap-1">
                        <Label className="text-[9px] uppercase">Precio Unit.</Label>
                        <Input 
                          type="number"
                          value={item.unitPrice} 
                          onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-6 border-dashed border-2 rounded-md text-[10px] text-muted-foreground uppercase font-bold">
                      No hay items en la cotización
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span>Total Estimado (Inc. IGV):</span>
                    <span className="text-lg text-primary">S/ {(items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0) * 1.18).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingQuotation ? "Actualizar" : "Crear Cotización"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por número o cliente..." 
              className="pl-9 h-9 text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Número</TableHead>
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Total (S/)</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations?.filter(q => 
                  q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((q) => {
                  const client = clients?.find(c => c.id === q.clientId)
                  return (
                    <TableRow key={q.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-primary uppercase">{q.quotationNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px]">{client?.name || "Desconocido"}</TableCell>
                      <TableCell>{q.date}</TableCell>
                      <TableCell className="font-black">S/ {(q.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingQuotation(q)}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingQuotation(q); setItems(q.items.map((i: any) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice }))); setIsAdding(true); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
