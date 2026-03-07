
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Edit2, 
  Loader2, 
  ArrowLeft,
  Download,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  CheckCircle2
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from "@/firebase"
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
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number}[]>([])

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

  // 2. Datos de Cotizaciones y Clientes
  const quotationsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "quotations"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: quotations, isLoading } = useCollection(quotationsRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // 3. Lógica de Numeración Correlativa Anual
  const suggestedQuotationNumber = useMemo(() => {
    const currentYear = new Date().getFullYear()
    if (!quotations) return `COT-0001-${currentYear}`
    const yearQuotations = quotations.filter(q => {
      const qDate = q.date ? new Date(q.date) : new Date()
      return qDate.getFullYear() === currentYear
    })
    const nextCount = yearQuotations.length + 1
    return `COT-${nextCount.toString().padStart(4, '0')}-${currentYear}`
  }, [quotations])

  // 4. Handlers de Items
  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // 5. Guardar Cotización
  const handleSaveQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
    const tax = subtotal * 0.18
    const total = subtotal + tax

    const quotationData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      quotationNumber: formData.get("number") as string || suggestedQuotationNumber,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      items: items.map(i => ({ 
        description: i.description, 
        quantity: Number(i.quantity || 0), 
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.quantity || 0) * Number(i.unitPrice || 0) 
      })),
      subtotal,
      tax,
      total,
      status: formData.get("status") as string || "Borrador",
      updatedAt: new Date().toISOString()
    }

    if (editingQuotation) {
      updateDocumentNonBlocking(doc(db, "quotations", editingQuotation.id), quotationData)
      toast({ title: "Proforma Actualizada" })
    } else {
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: newId, createdAt: new Date().toISOString() })
      toast({ title: "Proforma Generada" })
    }

    setIsAdding(false)
    setEditingQuotation(null)
    setItems([])
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "quotations", id))
    toast({ variant: "destructive", title: "Proforma Eliminada" })
  }

  const handlePrint = () => {
    window.print()
  }

  const openEdit = (q: any) => {
    setEditingQuotation(q)
    setItems(q.items?.map((i: any) => ({ 
      description: i.description, 
      quantity: Number(i.quantity || 1), 
      unitPrice: Number(i.unitPrice || 0) 
    })) || [])
    setIsAdding(true)
  }

  // VISTA DE IMPRESIÓN / DETALLE
  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    const currentYear = new Date().getFullYear()

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between no-print mb-4">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-[10px] text-primary">
            <ArrowLeft className="mr-2 h-3 w-3" /> Volver al Listado
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="font-bold uppercase text-[10px] h-8 border-primary text-primary">
              <Printer className="mr-2 h-3 w-3" /> Imprimir
            </Button>
            <Button onClick={handlePrint} className="bg-primary text-white font-bold uppercase text-[10px] h-8 shadow-md">
              <Download className="mr-2 h-3 w-3" /> Guardar PDF
            </Button>
          </div>
        </div>

        {/* CONTENEDOR A4 */}
        <div className="bg-white p-0 shadow-2xl mx-auto print-page w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden text-slate-900 border" id="quotation-print-area">
          
          {/* CABECERA: LOGO IZQUIERDA, TEXTO DERECHA */}
          {company?.headerUrl ? (
            <div className="relative w-full h-[180px] shrink-0 flex items-center justify-center overflow-hidden">
              <Image src={company.headerUrl} alt="Header Membrete" fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="pt-10 px-10 pb-6 shrink-0 flex items-center justify-between border-b-2 border-primary/10">
              {/* Logo a la izquierda */}
              <div className="relative h-20 w-44">
                {company?.logoUrl ? (
                  <Image src={company.logoUrl} alt="Logo Corporativo" fill className="object-contain" unoptimized />
                ) : (
                  <div className="h-full w-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 rounded">
                    <Building2 className="h-8 w-8 text-slate-300" />
                  </div>
                )}
              </div>
              
              {/* Razón Social y Número a la derecha */}
              <div className="text-right space-y-1">
                <h1 className="text-lg font-black text-primary uppercase tracking-tight">
                  {company?.name || "EXTINTORES APEVA SAAS"}
                </h1>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">COTIZACIÓN COMERCIAL</span>
                  <div className="mt-1 bg-primary text-white px-4 py-1.5 rounded font-bold text-xs shadow-sm">
                    N° {viewingQuotation.quotationNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUERPO DEL DOCUMENTO */}
          <div className="px-10 py-6 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-6">
              <div className="space-y-2">
                <h3 className="text-[9px] font-black text-primary uppercase border-b border-primary/20 pb-1">DATOS DEL CLIENTE</h3>
                <div className="text-[10px] space-y-1.5">
                  <p className="font-bold uppercase text-slate-900">{client?.name || "---"}</p>
                  <p className="text-slate-600 font-mono">ID FISCAL: {client?.taxId || "---"}</p>
                  <p className="text-slate-600">DIRECCIÓN: {client?.address || "---"}</p>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <h3 className="text-[9px] font-black text-primary uppercase border-b border-primary/20 pb-1">DETALLE DE EMISIÓN</h3>
                <div className="text-[10px] space-y-1.5">
                  <p className="font-bold">FECHA: {viewingQuotation.date || "---"}</p>
                  <p className="text-slate-600 uppercase">VALIDEZ: 15 DÍAS</p>
                  <p className="text-slate-600 uppercase">MONEDA: SOLES (S/.)</p>
                </div>
              </div>
            </div>

            {/* TABLA DE PRODUCTOS / SERVICIOS */}
            <div className="space-y-2">
              <h3 className="text-[9px] font-black text-primary uppercase flex items-center gap-2">
                <FileText className="h-3 w-3" /> SERVICIOS Y EQUIPOS
              </h3>
              <div className="border border-slate-200 rounded-sm overflow-hidden shadow-sm">
                <table className="w-full text-[10px] border-collapse">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-2.5 text-left font-bold uppercase w-12 border-r border-slate-700">CANT.</th>
                      <th className="p-2.5 text-left font-bold uppercase">DESCRIPCIÓN DEL SERVICIO</th>
                      <th className="p-2.5 text-right font-bold uppercase w-24 border-l border-slate-700">UNIT. (S/.)</th>
                      <th className="p-2.5 text-right font-bold uppercase w-24 border-l border-slate-700">TOTAL (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuotation.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-center font-bold border-r border-slate-100">{item.quantity || 0}</td>
                        <td className="p-2.5 font-medium uppercase text-slate-700">{item.description || "---"}</td>
                        <td className="p-2.5 text-right border-l border-slate-100">{(Number(item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold border-l border-slate-100">{(Number(item.total || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* FILAS VACÍAS PARA RELLENAR */}
                    {Array.from({ length: Math.max(0, 10 - (viewingQuotation.items?.length || 0)) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-8 border-b border-slate-50">
                        <td className="border-r border-slate-50"></td>
                        <td></td>
                        <td className="border-l border-slate-50"></td>
                        <td className="border-l border-slate-50"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOTALES */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2 pt-2">
                <div className="flex justify-between text-[10px] px-2">
                  <span className="font-bold uppercase text-slate-500">SUBTOTAL</span>
                  <span className="font-bold">S/. {(Number(viewingQuotation.subtotal || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] px-2">
                  <span className="font-bold uppercase text-slate-500">I.G.V. (18%)</span>
                  <span className="font-bold">S/. {(Number(viewingQuotation.tax || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[12px] bg-primary text-white p-3 rounded font-black mt-2 shadow-sm">
                  <span className="uppercase">TOTAL NETO</span>
                  <span>S/. {(Number(viewingQuotation.total || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <h3 className="text-[9px] font-black text-primary uppercase border-b border-primary/20 w-fit pb-1">CONDICIONES COMERCIALES</h3>
              <ul className="text-[9px] text-slate-500 space-y-1.5 uppercase font-bold leading-tight">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-primary opacity-50" /> LOS EQUIPOS CUMPLEN CON LAS NORMAS TÉCNICAS PERUANAS (NTP).</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-primary opacity-50" /> GARANTÍA DE FÁBRICA POR 01 AÑO CONTRA DEFECTOS DE CARGA.</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-primary opacity-50" /> FORMA DE PAGO: CONTADO / TRANSFERENCIA BANCARIA.</li>
              </ul>
            </div>
          </div>

          {/* PIE DE PÁGINA: CENTRADO TOTAL */}
          {company?.footerUrl ? (
            <div className="relative w-full h-[120px] shrink-0 mt-auto flex items-center justify-center overflow-hidden">
              <Image src={company.footerUrl} alt="Footer Membrete" fill className="object-contain" unoptimized />
            </div>
          ) : (
            <div className="mt-auto p-10 bg-slate-50 border-t flex flex-col items-center text-center gap-4 shrink-0">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[9px] font-bold text-slate-500 uppercase">
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> {company?.address || "LIMA, PERÚ"}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {company?.phone || "CENTRAL DE SERVICIOS"}</p>
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {company?.email || "EMAIL DE CONTACTO"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">SISTEMA SAAS MASTER SYNC © {currentYear}</p>
              </div>
            </div>
          )}

          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              #quotation-print-area, #quotation-print-area * { visibility: visible; }
              #quotation-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: A4; margin: 0; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // LISTADO PRINCIPAL
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Gestión de Ventas</h2>
          <p className="text-muted-foreground text-sm italic font-medium">Genere proformas oficiales con diseño corporativo Apeva.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white h-10 font-bold uppercase text-xs px-6 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nueva Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveQuotation}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-primary text-xl tracking-tight">Emisión de Proforma</DialogTitle>
                <DialogDescription className="text-xs font-bold text-slate-500 uppercase">Reinicia correlativo anual automáticamente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente</Label>
                    <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                      <SelectTrigger className="h-10 border-slate-200">
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
                    <Label className="text-[10px] font-black uppercase text-slate-500">N° Proforma</Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber || suggestedQuotationNumber} placeholder="COT-0001-2025" className="h-10 uppercase font-mono font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Estado</Label>
                    <Select name="status" defaultValue={editingQuotation?.status || "Borrador"}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Borrador">Borrador</SelectItem>
                        <SelectItem value="Enviado">Enviado</SelectItem>
                        <SelectItem value="Aceptado">Aceptado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Label className="text-[11px] font-black uppercase text-primary tracking-wider">Detalle de Servicios</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase bg-slate-900 text-white hover:bg-slate-800">
                      <Plus className="h-3 w-3 mr-2" /> Agregar Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-xl bg-slate-50/50 shadow-sm">
                        <div className="col-span-12 md:col-span-6 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Descripción</Label>
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="Ej. Recarga de Extintor PQS..."
                            className="h-10 text-xs font-bold"
                            required
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Cantidad</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                            className="h-10 text-xs text-center font-black"
                            required
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Precio Unitario (S/)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="h-10 text-xs text-right font-black"
                            required
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">Total a Pagar</p>
                    <p className="text-3xl font-black text-white tracking-tighter">
                      S/. {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 1.18).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center md:items-end text-[10px] font-bold opacity-80 uppercase">
                    <p>Subtotal: S/. {items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0).toFixed(2)}</p>
                    <p>I.G.V. (18%): S/. {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 0.18).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t pt-6">
                <Button type="submit" className="w-full h-12 uppercase font-black text-xs tracking-widest bg-slate-900 hover:bg-black">
                  {editingQuotation ? "Actualizar Proforma" : "Generar Proforma"}
                </Button>
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
              placeholder="Buscar por N° o Cliente..." 
              className="pl-9 h-9 text-xs font-bold uppercase border-slate-200" 
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
              <TableHeader className="bg-primary hover:bg-primary">
                <TableRow className="border-none">
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">N° Proforma</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">Cliente</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px] text-right pr-6">Total (S/.)</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white h-12 text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations?.filter(q => 
                  q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  clients?.find(c => c.id === q.clientId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((q) => {
                  const client = clients?.find(c => c.id === q.clientId)
                  return (
                    <TableRow key={q.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-primary uppercase tracking-tight">{q.quotationNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px] text-slate-700">{client?.name || "---"}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-slate-900">S/. {(Number(q.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5",
                          q.status === "Aceptado" ? "bg-status-success/10 text-status-success border-status-success/20" : 
                          q.status === "Enviado" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => setViewingQuotation(q)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:bg-slate-100" onClick={() => openEdit(q)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="h-4 w-4" />
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
