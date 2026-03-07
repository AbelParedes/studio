
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Building2,
  FileText,
  Globe,
  Gavel,
  Printer,
  Download,
  PackageSearch,
  Calculator,
  Briefcase,
  CalendarDays,
  Tag
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
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
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

  // 2. Datos de Cotizaciones, Clientes y Catálogo
  const quotationsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "quotations"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: quotations, isLoading } = useCollection(quotationsRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  const catalogRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: catalog } = useCollection(catalogRef)

  // 3. Lógica de Numeración Correlativa Anual
  const currentYear = new Date().getFullYear()
  const suggestedQuotationNumber = useMemo(() => {
    if (!quotations || quotations.length === 0) return `COT-0001-${currentYear}`
    
    const yearQuotations = quotations.filter(q => {
      const qNum = q.quotationNumber || ""
      return qNum.startsWith("COT-") && qNum.endsWith(`-${currentYear}`)
    })

    if (yearQuotations.length === 0) return `COT-0001-${currentYear}`

    const numbers = yearQuotations.map(q => {
      const parts = q.quotationNumber.split("-")
      return parts.length === 3 ? parseInt(parts[1]) : 0
    })
    
    const maxNum = Math.max(...numbers)
    return `COT-${(maxNum + 1).toString().padStart(4, '0')}-${currentYear}`
  }, [quotations, currentYear])

  const subtotal = useMemo(() => 
    items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0),
  [items])
  const tax = subtotal * 0.18
  const total = subtotal + tax

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

  const handleSaveQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)

    const quotationData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      quotationNumber: formData.get("number") as string || suggestedQuotationNumber,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      items: items.map(i => ({ 
        description: i.description, 
        quantity: Number(i.quantity || 0), 
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.quantity || 0) * Number(i.unitPrice || 0),
        catalogItemId: i.catalogItemId || null
      })),
      subtotal,
      tax,
      total,
      conditions: formData.get("conditions") as string,
      status: formData.get("status") as string || "Borrador",
      updatedAt: new Date().toISOString()
    }

    if (editingQuotation) {
      updateDocumentNonBlocking(doc(db, "quotations", editingQuotation.id), quotationData)
      toast({ title: "Cotización Actualizada" })
    } else {
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: newId, createdAt: new Date().toISOString() })
      toast({ title: "Cotización Generada" })
    }

    setIsAdding(false)
    setEditingQuotation(null)
    setItems([])
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "quotations", id))
    toast({ variant: "destructive", title: "Cotización Eliminada" })
  }

  const openEdit = (q: any) => {
    setEditingQuotation(q)
    setItems(q.items?.map((i: any) => ({ 
      description: i.description, 
      quantity: Number(i.quantity || 1), 
      unitPrice: Number(i.unitPrice || 0),
      catalogItemId: i.catalogItemId
    })) || [])
    setIsAdding(true)
  }

  const handlePrint = () => {
    window.print()
  }

  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    const conditions = viewingQuotation.conditions || "• Validez de la oferta: 15 días.\n• Forma de pago: Contado / Transferencia.\n• Tiempo de ejecución: A coordinar.\n• Garantía de servicio: 12 meses."
    const formattedDate = viewingQuotation.date 
      ? format(parseISO(viewingQuotation.date), "dd/MM/yyyy") 
      : "---"

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-[10px]">
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

        <div className="proforma-container bg-white p-0 shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden text-[#1c1c1c] border print:shadow-none print:border-none print:m-0 print:w-full print:min-h-[297mm]">
          <div className="pt-12 px-12 pb-8 shrink-0 flex items-center justify-between border-b-[3px] border-[#d9534f]">
            <div className="relative h-20 w-64">
              {(company?.headerUrl || company?.logoUrl) ? (
                <Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
              ) : (
                <div className="h-full w-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 rounded">
                  <Building2 className="h-10 w-10 text-slate-300" />
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <h1 className="text-sm font-black text-[#1c1c1c] uppercase tracking-tighter leading-none">
                {company?.name || "EXTINTORES APEVA"}
              </h1>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-600">RUC: {company?.taxId || "---"}</span>
                <span className="text-[9px] font-black text-[#d9534f] uppercase tracking-[0.2em] mt-2">COTIZACIÓN</span>
                <div className="mt-2 bg-[#1c1c1c] text-white px-6 py-2 rounded-md font-black text-[12px] shadow-md border-b-2 border-[#d9534f]">
                   N° {viewingQuotation.quotationNumber}
                </div>
              </div>
            </div>
          </div>

          <div className="px-12 py-8 space-y-8 flex-1 bg-white">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-[#d9534f] uppercase shrink-0">DATOS DEL CLIENTE</h3>
                  <div className="h-[2px] bg-[#1c1c1c] w-full"></div>
                </div>
                <div className="text-[11px] space-y-2 pt-1">
                  <p className="font-black uppercase text-[#1c1c1c] text-[12px]">{client?.name || "---"}</p>
                  <p className="text-slate-600 font-bold uppercase"><span className="text-slate-400 font-normal">DNI / RUC:</span> {client?.taxId || "---"}</p>
                  <p className="text-slate-600 font-bold uppercase"><span className="text-slate-400 font-normal">DIRECCIÓN:</span> {client?.address || "---"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black text-[#d9534f] uppercase shrink-0">DETALLE DE EMISIÓN</h3>
                  <div className="h-[2px] bg-[#1c1c1c] w-full"></div>
                </div>
                <div className="text-[11px] space-y-2 pt-1 text-right">
                  <p className="font-black text-[#1c1c1c] uppercase"><span className="text-slate-400 font-normal">FECHA:</span> {formattedDate}</p>
                  <p className="text-slate-600 uppercase font-bold"><span className="text-slate-400 font-normal">MONEDA:</span> SOLES (S/.)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-[10px] font-black text-[#1c1c1c] uppercase flex items-center gap-2 tracking-widest">
                <FileText className="h-4 w-4 text-[#d9534f]" /> REQUERIMIENTO
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-[10px] border-collapse">
                  <thead className="bg-[#1c1c1c] text-white">
                    <tr>
                      <th className="p-3 text-center font-black uppercase w-16 border-r border-white/10">CANT.</th>
                      <th className="p-3 text-left font-black uppercase">DESCRIPCIÓN</th>
                      <th className="p-3 text-right font-black uppercase w-28 border-l border-white/10">UNIT. (S/.)</th>
                      <th className="p-3 text-right font-black uppercase w-28 border-l border-white/10">TOTAL (S/.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingQuotation.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold border-r border-slate-100">{(item.quantity || 0)}</td>
                        <td className="p-3 font-medium uppercase text-slate-700">{(item.description || "---")}</td>
                        <td className="p-3 text-right border-l border-slate-100">{(Number(item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="p-3 text-right font-black border-l border-slate-100 text-[#1c1c1c]">{(Number(item.total || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-12 pt-4">
              <div className="col-span-7 space-y-3">
                <h3 className="text-[10px] font-black text-[#1c1c1c] uppercase flex items-center gap-2 tracking-widest">
                  <Gavel className="h-4 w-4 text-[#d9534f]" /> CONDICIONES COMERCIALES
                </h3>
                <div className="p-4 bg-slate-50 border rounded-lg text-[10px] text-slate-600 leading-relaxed whitespace-pre-line font-medium border-dashed border-slate-300">
                  {conditions}
                </div>
              </div>
              <div className="col-span-5 flex justify-end items-start">
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-[10px] px-3 font-bold">
                    <span className="uppercase text-slate-400">SUBTOTAL</span>
                    <span className="text-[#1c1c1c]">S/. {(Number(viewingQuotation.subtotal || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] px-3 font-bold">
                    <span className="uppercase text-slate-400">I.G.V. (18%)</span>
                    <span className="text-[#1c1c1c]">S/. {(Number(viewingQuotation.tax || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] bg-[#1c1c1c] text-white p-4 rounded-xl font-black mt-3 shadow-lg border-b-4 border-[#d9534f]">
                    <span className="uppercase tracking-wider">TOTAL NETO</span>
                    <span className="text-base">S/. {(Number(viewingQuotation.total || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="mt-auto shrink-0 flex flex-col items-center justify-center py-6 print-footer"
            style={{ 
              backgroundColor: company?.footerBgColor || 'rgb(255, 215, 0)',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            } as any}
          >
            <div className="px-12 w-full flex flex-col items-center text-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-[10px] font-black text-[#1c1c1c] uppercase">
                {company?.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {company.address}</p>}
                {company?.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {company.phone}</p>}
                {company?.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {company.email}</p>}
              </div>
              <div className="mt-1">
                <p className="text-[10px] font-black text-[#1c1c1c] uppercase tracking-[0.2em] flex items-center gap-2">
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
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-[#d9534f]">Gestión Comercial</h2>
          <p className="text-muted-foreground text-sm italic font-medium">Cotizaciones oficiales bajo estándares industriales.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#d9534f] hover:bg-[#c9302c] text-white h-10 font-bold uppercase text-xs px-6 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveQuotation} className="flex flex-col h-full">
              <DialogHeader className="p-6 border-b bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#d9534f] rounded-xl flex items-center justify-center text-white shadow-md">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="uppercase font-black text-[#d9534f] text-xl tracking-tight leading-none">Nueva Proforma Oficial</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sugerido: {suggestedQuotationNumber} • Extintores Apeva SaaS</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* SECCIÓN 1: DATOS GENERALES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Cliente Destino
                    </Label>
                    <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                      <SelectTrigger className="h-11 border-2 focus:ring-[#d9534f]/20">
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
                      <Tag className="h-3 w-3" /> Número de Serie
                    </Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber || suggestedQuotationNumber} className="h-11 uppercase font-mono font-bold border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" /> Fecha de Emisión
                    </Label>
                    <Input type="date" name="date" defaultValue={editingQuotation?.date || new Date().toISOString().split('T')[0]} className="h-11 border-2 font-bold" />
                  </div>
                </div>

                {/* SECCIÓN 2: CONCEPTOS Y CATÁLOGO */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-[#d9534f]" />
                      <h3 className="text-[11px] font-black uppercase text-[#d9534f] tracking-widest">Conceptos del Presupuesto</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase border-2 hover:bg-slate-50">
                      <Plus className="h-3 w-3 mr-2" /> Añadir Concepto
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end p-5 rounded-2xl bg-white border-2 border-slate-100 shadow-sm relative group">
                        <div className="col-span-12 md:col-span-4 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                            <PackageSearch className="h-3 w-3 text-[#d9534f]" /> Cargar del Catálogo Maestro
                          </Label>
                          <Select 
                            value={item.catalogItemId || ""} 
                            onValueChange={(val) => handleSelectFromCatalog(idx, val)}
                          >
                            <SelectTrigger className="h-10 text-[10px] font-bold bg-slate-50 border-none">
                              <SelectValue placeholder="Seleccionar ítem..." />
                            </SelectTrigger>
                            <SelectContent>
                              {catalog?.map(p => (
                                <SelectItem key={p.id} value={p.id} className="text-[11px] font-medium">
                                  [{p.category}] {p.description} • S/ {p.sellPrice}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-12 md:col-span-4 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Descripción en Proforma</Label>
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="h-10 text-xs font-bold border-2"
                            required
                            placeholder="Ej. Recarga de Extintor PQS 6kg ABC"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-1 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Cant.</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                            className="h-10 text-xs text-center font-black border-2"
                            required
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">P. Unit. (S/)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="h-10 text-xs text-right font-black border-2 text-[#d9534f]"
                            required
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-slate-50">
                        <PackageSearch className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase text-slate-400">Presione 'Añadir Concepto' para comenzar</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 3: CONDICIONES Y RESUMEN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1.5">
                      <Gavel className="h-3 w-3" /> Condiciones Comerciales
                    </Label>
                    <Textarea 
                      name="conditions" 
                      defaultValue={editingQuotation?.conditions || "• Validez de la oferta: 15 días.\n• Forma de pago: Contado / Transferencia.\n• Tiempo de ejecución: A coordinar.\n• Garantía de servicio: 12 meses."}
                      className="min-h-[140px] text-xs font-medium border-2 leading-relaxed"
                      placeholder="Ingrese los términos de la oferta..."
                    />
                  </div>
                  <div className="bg-[#1c1c1c] text-white p-8 rounded-[2rem] flex flex-col justify-between shadow-2xl border-b-[6px] border-[#d9534f] animate-in zoom-in-95 duration-300">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold opacity-60 uppercase tracking-widest">
                        <span>Estado del Documento</span>
                        <Select name="status" defaultValue={editingQuotation?.status || "Borrador"}>
                          <SelectTrigger className="h-7 w-32 bg-white/10 border-none text-[9px] font-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Borrador">Borrador</SelectItem>
                            <SelectItem value="Enviado">Enviado</SelectItem>
                            <SelectItem value="Aceptado">Aceptado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="h-px bg-white/10"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold opacity-80 uppercase">
                          <span>Subtotal</span>
                          <span>S/. {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold opacity-80 uppercase">
                          <span>I.G.V. (18%)</span>
                          <span>S/. {tax.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8">
                      <p className="text-[10px] font-black uppercase text-accent mb-1 tracking-widest">Inversión Total Estimada</p>
                      <p className="text-4xl font-black text-white tracking-tighter leading-none">
                        S/. {total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50">
                <div className="flex gap-4 w-full">
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 h-12 uppercase font-black text-[10px] tracking-widest">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-[2] h-12 uppercase font-black text-xs tracking-widest bg-[#d9534f] hover:bg-[#c9302c] text-white shadow-xl">
                    {editingQuotation ? "Actualizar Proforma" : "Generar Documento Maestro"}
                  </Button>
                </div>
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
              className="pl-9 h-9 text-xs font-bold uppercase" 
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
              <TableHeader className="bg-[#1c1c1c] hover:bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">Identificador</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Cliente</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6">Total Neto (S/.)</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
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
                      <TableCell className="font-black text-[#d9534f] uppercase tracking-tight">{q.quotationNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px] text-[#1c1c1c]">{client?.name || "---"}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-[#1c1c1c]">S/. {(Number(q.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5",
                          q.status === "Aceptado" ? "bg-status-success/10 text-status-success" : 
                          q.status === "Enviado" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"
                        )}>
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#d9534f]" onClick={() => setViewingQuotation(q)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#1c1c1c]" onClick={() => openEdit(q)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => handleDelete(q.id)}>
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
