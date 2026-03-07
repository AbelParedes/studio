
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
  MousePointer2
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

        {/* Formato Membretado A4 Extintores Apeva */}
        <div className="bg-white p-0 shadow-2xl mx-auto print-container max-w-[21cm] min-h-[29.7cm] flex flex-col relative overflow-hidden text-slate-900">
          
          {/* Fondo Membretado (Header) */}
          <div className="pt-10 px-10 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-red-600 flex items-center justify-center bg-white shadow-sm">
                    <span className="text-red-600 font-black text-2xl italic">EA</span>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-red-600 tracking-tighter leading-none italic uppercase">EXTINTORES APEVA</h1>
                    <p className="text-[10px] font-bold text-gray-600 uppercase italic mt-0.5">Su seguridad por encima de todo</p>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="border-[3px] border-primary p-4 rounded-xl bg-slate-50 min-w-[180px] shadow-sm">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">COTIZACIÓN</p>
                  <p className="text-xl font-black text-slate-800">{viewingQuotation.quotationNumber}</p>
                </div>
                <p className="text-[10px] mt-2 font-bold text-slate-500 uppercase tracking-tighter">Emisión: {viewingQuotation.date}</p>
              </div>
            </div>
          </div>

          {/* Línea Divisoria Membretada */}
          <div className="px-10">
            <div className="h-[2px] bg-slate-400 w-full mb-[2px]"></div>
            <div className="h-[2px] bg-slate-400 w-full"></div>
          </div>

          {/* Cuerpo de la Cotización */}
          <div className="p-10 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-10 mb-8">
              <div className="space-y-1.5 p-4 border-l-4 border-primary bg-slate-50 rounded-r-lg">
                <p className="font-black uppercase text-slate-400 text-[9px] tracking-widest">DATOS DEL CLIENTE</p>
                <p className="font-black text-sm uppercase text-primary">{client?.name || "Desconocido"}</p>
                <p className="text-[11px] font-bold text-slate-700">RUC / DNI: <span className="font-mono">{client?.taxId}</span></p>
                <div className="flex items-start gap-1 text-[11px] text-slate-600">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{client?.address}</span>
                </div>
              </div>
              <div className="text-right space-y-1.5 p-4 border-r-4 border-red-600 bg-red-50/30 rounded-l-lg">
                <p className="font-black uppercase text-slate-400 text-[9px] tracking-widest">LUGAR DE SERVICIO</p>
                <p className="font-bold text-[11px] text-slate-700 uppercase">Sede Independencia - Lima Norte</p>
                <p className="text-[10px] text-slate-500 italic">Válido para todo Lima Metropolitana</p>
              </div>
            </div>

            <div className="flex-1">
              <Table className="border rounded-lg overflow-hidden border-slate-200">
                <TableHeader className="bg-slate-800 hover:bg-slate-800">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-black uppercase text-[10px] tracking-wider py-4">DESCRIPCIÓN DEL EQUIPO O SERVICIO</TableHead>
                    <TableHead className="text-center text-white font-black uppercase text-[10px] tracking-wider py-4 w-20">CANT.</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-4 w-28">P. UNIT (S/)</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-4 w-28">SUBTOTAL (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingQuotation.items.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-100 last:border-none">
                      <TableCell className="font-bold uppercase text-[11px] py-4 text-slate-700">{item.description}</TableCell>
                      <TableCell className="text-center font-bold text-[11px] py-4">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-[11px] py-4">{(item.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black text-[11px] py-4 text-slate-900">{(item.total || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Filas de relleno para estética A4 */}
                  {viewingQuotation.items.length < 8 && Array(8 - viewingQuotation.items.length).fill(0).map((_, i) => (
                    <TableRow key={`empty-${i}`} className="h-10 border-b border-slate-50/50">
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-72 space-y-2 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-500">Subtotal Operativo</span>
                  <span className="font-bold text-slate-700">S/ {(viewingQuotation.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-500">IGV (18%)</span>
                  <span className="font-bold text-slate-700">S/ {(viewingQuotation.tax || 0).toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-300 my-2"></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-black uppercase text-red-600 text-xs tracking-widest">TOTAL NETO</span>
                  <span className="font-black text-red-600 text-xl tracking-tighter">S/ {(viewingQuotation.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">TÉRMINOS Y CONDICIONES</p>
                <ul className="text-[9px] text-slate-500 space-y-1 font-bold italic">
                  <li>• Vigencia de la cotización: 15 días calendario.</li>
                  <li>• Los precios incluyen entrega a domicilio en Lima Metropolitana.</li>
                  <li>• Forma de pago: Contado / Transferencia bancaria.</li>
                  <li>• Todos los equipos cuentan con certificación y garantía.</li>
                </ul>
              </div>
              <div className="flex flex-col items-center justify-end">
                <div className="w-40 h-px bg-slate-400 mb-2"></div>
                <p className="text-[10px] font-black uppercase text-primary">DPTO. DE VENTAS</p>
                <p className="text-[9px] font-bold text-slate-400">Extintores Apeva SAC</p>
              </div>
            </div>
          </div>

          {/* Footer Membretado Amarillo (Full Width) */}
          <div className="bg-[#ffdd00] py-6 px-10 no-print-bg">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-8 w-full max-w-4xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800">
                  <MapPin className="h-3.5 w-3.5 text-red-600" />
                  <span>Av. Naranjal 215 int A 06 Independencia - Lima</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800">
                  <Phone className="h-3.5 w-3.5 text-red-600" />
                  <span>933 261 752 / 918 790 212</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-8 w-full max-w-4xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800">
                  <Mail className="h-3.5 w-3.5 text-red-600" />
                  <span className="lowercase">extintoresapeva@hotmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800">
                  <Globe className="h-3.5 w-3.5 text-red-600" />
                  <span className="lowercase">www.extintoresapeva.com</span>
                </div>
              </div>
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
