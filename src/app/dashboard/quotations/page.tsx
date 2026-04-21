
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
  Printer,
  Download,
  PackageSearch,
  Calculator,
  Briefcase,
  CalendarDays,
  Tag,
  Repeat
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser, useDoc } from "@/firebase"
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
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number, catalogItemId?: string}[]>([])
  const [isConverting, setIsConverting] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState("Borrador")
  const documentRef = useRef<HTMLDivElement>(null)

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const companyRef = useMemoFirebase(() => 
    companyId ? doc(db, "companies", companyId) : null,
  [db, companyId])
  const { data: company } = useDoc(companyRef)

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

  const currentYear = new Date().getFullYear()
  const suggestedQuotationNumber = useMemo(() => {
    if (!quotations || quotations.length === 0) return `COT-0001-${currentYear}`
    const yearQuotations = quotations.filter(q => q.quotationNumber?.endsWith(`-${currentYear}`))
    if (yearQuotations.length === 0) return `COT-0001-${currentYear}`
    const numbers = yearQuotations.map(q => {
      const parts = q.quotationNumber.split("-")
      return parts.length >= 2 ? parseInt(parts[1]) : 0
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
      newItems[index] = { ...newItems[index], catalogItemId: product.id, description: product.description, unitPrice: product.sellPrice }
      setItems(newItems)
    }
  }

  const handleSaveQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return
    const formData = new FormData(e.currentTarget)
    const quotationData = {
      companyId,
      clientId: formData.get("clientId") as string,
      quotationNumber: formData.get("number") as string || suggestedQuotationNumber,
      date: formData.get("date") as string || format(new Date(), "yyyy-MM-dd"),
      validityDays: Number(formData.get("validityDays") || 15),
      items: items.map(i => ({ 
        description: i.description, 
        quantity: Number(i.quantity || 0), 
        unitPrice: Number(i.unitPrice || 0),
        total: Number(i.quantity || 0) * Number(i.unitPrice || 0),
        catalogItemId: i.catalogItemId || null
      })),
      subtotal, tax, total,
      conditions: formData.get("conditions") as string,
      status: currentStatus,
      updatedAt: new Date().toISOString()
    }

    if (editingQuotation) {
      updateDocumentNonBlocking(doc(db, "quotations", editingQuotation.id), quotationData)
      toast({ title: "Proforma actualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      toast({ title: "Proforma generada" })
    }
    setIsAdding(false); setEditingQuotation(null); setItems([]); setCurrentStatus("Borrador")
  }

  const handleDelete = (id: string) => {
    if(!confirm("¿Eliminar esta proforma de forma permanente?")) return
    deleteDocumentNonBlocking(doc(db, "quotations", id))
    toast({ variant: "destructive", title: "Proforma eliminada" })
  }

  const openEdit = (q: any) => {
    setEditingQuotation(q)
    setItems(q.items || [])
    setCurrentStatus(q.status || "Borrador")
    setIsAdding(true)
  }

  const handleConvertToOrder = async (q: any) => {
    if (!companyId) return
    setIsConverting(q.id)
    try {
      const orderNumber = `OS-${q.quotationNumber.split('-')[1]}-${currentYear}`
      await addDocumentNonBlocking(collection(db, "service_orders"), {
        id: crypto.randomUUID(), companyId, clientId: q.clientId, quotationId: q.id,
        orderNumber, date: format(new Date(), "yyyy-MM-dd"), items: q.items, total: q.total,
        status: "Pendiente", createdAt: new Date().toISOString()
      })
      await updateDoc(doc(db, "quotations", q.id), { status: "Convertido" })
      toast({ title: "¡Orden de Servicio Creada!", description: orderNumber })
      router.push("/dashboard/service-orders")
    } catch (e) { toast({ variant: "destructive", title: "Error al convertir" }) } finally { setIsConverting(null) }
  }

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return
    setIsDownloading(true)
    
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      let heightLeft = finalHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight)
      heightLeft -= pdfHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - finalHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, finalWidth, finalHeight)
        heightLeft -= pdfHeight
      }
      
      pdf.save(`COTIZACION-${viewingQuotation?.quotationNumber || 'DOCUMENTO'}.pdf`)
    } catch (error) {
      console.error("PDF Error:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients?.find(c => c.id === q.clientId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-[10px]">
            <ArrowLeft className="mr-2 h-3 w-3" /> Regresar
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            {viewingQuotation.status !== "Convertido" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold uppercase text-[10px] border-status-success text-status-success flex-1"
                onClick={() => handleConvertToOrder(viewingQuotation)}
                disabled={isConverting === viewingQuotation.id}
              >
                Convertir a OS
              </Button>
            )}
            <Button size="sm" onClick={() => window.print()} className="bg-primary text-white font-bold uppercase text-[10px] flex-1">
              <Printer className="mr-2 h-3 w-3" /> Imprimir
            </Button>
            <Button 
              size="sm" 
              className="bg-accent text-white font-bold uppercase text-[10px] flex-1"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
              PDF
            </Button>
          </div>
        </div>

        <div 
          ref={documentRef}
          className="proforma-container bg-white shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col relative text-[#1c1c1c] border print:shadow-none print:border-none print:m-0 print:w-full"
        >
          <div className="p-12 space-y-10 flex-1">
             <div className="flex justify-between items-start">
                <div className="h-20 w-64 relative">
                  {(company?.headerUrl || company?.logoUrl) && <Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />}
                </div>
                <div className="text-right">
                  <h1 className="text-sm font-black uppercase text-primary tracking-tighter mb-1">
                    {company?.name || "EXTINPRO"}
                  </h1>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold text-slate-600">RUC: {company?.taxId || "---"}</span>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-2">COTIZACIÓN COMERCIAL</span>
                    <div className="mt-2 bg-slate-100 text-[#1c1c1c] px-6 py-2 rounded-md font-black text-[12px] shadow-sm border-b-2 border-slate-300">
                      N° {viewingQuotation.quotationNumber}
                    </div>
                  </div>
                  <div className="mt-4 bg-slate-50 px-4 py-1.5 rounded font-black text-[9px] uppercase inline-block border border-slate-200">
                    Vigencia de Oferta: {viewingQuotation.validityDays || 15} Días
                  </div>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-12 text-[11px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4"><h3 className="text-[9px] font-black text-slate-400 uppercase shrink-0">CLIENTE / ENTIDAD</h3><div className="h-[1px] bg-slate-100 w-full"></div></div>
                  <div className="space-y-1 pt-1">
                    <p className="font-black text-sm uppercase">{client?.name || "---"}</p>
                    <p className="font-bold text-slate-500 uppercase">RUC/DNI: {client?.taxId || "---"}</p>
                    <p className="text-slate-500 uppercase leading-tight">{client?.address || "---"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4"><h3 className="text-[9px] font-black text-slate-400 uppercase shrink-0">DETALLES EMISIÓN</h3><div className="h-[1px] bg-slate-100 w-full"></div></div>
                  <div className="text-right space-y-1 pt-1">
                    <p className="font-bold uppercase text-slate-700">Fecha de Emisión: <span className="font-black">{viewingQuotation.date}</span></p>
                    <p className="font-bold uppercase text-slate-700">Moneda: <span className="font-black">Soles (S/)</span></p>
                    <div className="mt-2 inline-block">
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-status-success/5 text-status-success border-status-success/20">
                        Estado: {viewingQuotation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
             </div>

             <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                    <tr>
                      <th className="p-4 text-center w-16 border-r border-slate-200 font-black uppercase">CANT</th>
                      <th className="p-4 text-left font-black uppercase">DESCRIPCIÓN DE PRODUCTO / SERVICIO</th>
                      <th className="p-4 text-right w-28 border-l border-slate-200 font-black uppercase">UNIT (S/)</th>
                      <th className="p-4 text-right w-28 border-l border-slate-200 font-black uppercase">TOTAL (S/)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuotation.items?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-center font-black text-primary border-r border-slate-100">{item.quantity}</td>
                        <td className="p-4 uppercase font-medium text-slate-700">{item.description}</td>
                        <td className="p-4 text-right border-l border-slate-100 text-slate-600">{(Number(item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="p-4 text-right font-black border-l border-slate-100 text-primary">{(Number(item.total || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <div className="flex justify-between items-start gap-12">
                <div className="flex-1">
                  {viewingQuotation.conditions && (
                    <div className="space-y-2">
                      <h3 className="text-[9px] font-black uppercase text-primary border-b border-primary/10 pb-1 tracking-widest">Condiciones Comerciales</h3>
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed font-medium">
                        {viewingQuotation.conditions}
                      </p>
                    </div>
                  )}
                </div>
                <div className="w-72 space-y-1.5 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Subtotal</span><span>S/ {(Number(viewingQuotation.subtotal || 0)).toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>I.G.V (18%)</span><span>S/ {(Number(viewingQuotation.tax || 0)).toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-black border-t-2 border-slate-200 pt-3 text-primary mt-2 uppercase tracking-tighter"><span>Total Neto</span><span>S/ {(Number(viewingQuotation.total || 0)).toFixed(2)}</span></div>
                </div>
             </div>
          </div>

          <div 
            className="mt-auto shrink-0 flex flex-col items-center justify-center py-8 print-footer"
            style={{ 
              backgroundColor: company?.footerBgColor || '#f8fafc',
              borderTop: '1px solid #e2e8f0'
            } as any}
          >
            <div className="px-12 w-full flex flex-col items-center text-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-1 text-[10px] font-black text-slate-600 uppercase">
                {company?.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {company.address}</p>}
                {company?.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {company.phone}</p>}
                {company?.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {company.email}</p>}
              </div>
              <div className="mt-1 pt-3 border-t border-slate-200/30 w-full max-w-md">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                  <Globe className="h-3.5 w-3.5" /> {company?.website || "WWW.EXTINPRO.PE"}
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 uppercase text-[#d9534f]">Gestión Comercial</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Emisión de proformas industriales.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); setCurrentStatus("Borrador"); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#d9534f] hover:bg-[#c9302c] text-white h-10 font-bold uppercase text-xs shadow-lg w-full sm:w-auto px-8">
              <Plus className="mr-2 h-4 w-4" /> Nueva Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveQuotation} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="p-4 sm:p-6 border-b bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#d9534f] rounded-xl flex items-center justify-center text-white shadow-md">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="uppercase font-black text-[#d9534f] text-lg">
                      {editingQuotation ? "Editar Proforma Oficial" : "Nueva Proforma Oficial"}
                    </DialogTitle>
                    <DialogDescription className="text-[9px] font-bold uppercase">
                      {editingQuotation ? `Editando: ${editingQuotation.quotationNumber}` : `Correlativo Sugerido: ${suggestedQuotationNumber}`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="grid gap-1.5 md:col-span-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente</Label>
                    <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                      <SelectTrigger className="h-10 border-2"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">N° Proforma</Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber || suggestedQuotationNumber} className="h-10 uppercase font-mono font-bold" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Fecha</Label>
                    <Input type="date" name="date" defaultValue={editingQuotation?.date || format(new Date(), "yyyy-MM-dd")} className="h-10 font-bold" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Validez (Días)</Label>
                    <Input name="validityDays" type="number" defaultValue={editingQuotation?.validityDays || 15} className="h-10 font-bold" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Estado</Label>
                    <Select value={currentStatus} onValueChange={setCurrentStatus}>
                      <SelectTrigger className="h-10 border-2 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Borrador">Borrador</SelectItem>
                        <SelectItem value="Enviado">Enviado</SelectItem>
                        <SelectItem value="Aceptado">Aceptado</SelectItem>
                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-[10px] font-black uppercase text-[#d9534f]">Conceptos</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-[9px] font-black uppercase">
                      <Plus className="h-3 w-3 mr-1" /> Añadir Ítem
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 border-2 rounded-xl bg-slate-50/50">
                        <div className="sm:col-span-4 grid gap-1">
                          <Label className="text-[8px] font-black uppercase opacity-50">Catálogo</Label>
                          <Select value={item.catalogItemId || ""} onValueChange={(val) => handleSelectFromCatalog(idx, val)}>
                            <SelectTrigger className="h-8 text-[10px] bg-white border-none"><SelectValue placeholder="Catálogo..." /></SelectTrigger>
                            <SelectContent>{catalog?.map(p => <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">[{p.category}] {p.description}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-4 grid gap-1">
                          <Label className="text-[8px] font-black uppercase opacity-50">Descripción Proforma</Label>
                          <Input value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} className="h-8 text-[10px] font-bold" required />
                        </div>
                        <div className="sm:col-span-1 grid gap-1">
                          <Label className="text-[8px] font-black uppercase opacity-50">Cant.</Label>
                          <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))} className="h-8 text-[10px] text-center font-black" required />
                        </div>
                        <div className="sm:col-span-2 grid gap-1">
                          <Label className="text-[8px] font-black uppercase opacity-50">P. Unit.</Label>
                          <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))} className="h-8 text-[10px] text-right font-black" required />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Condiciones Comerciales</Label>
                    <Textarea name="conditions" className="min-h-[120px] text-[10px] font-medium leading-relaxed" defaultValue={editingQuotation?.conditions || "• Validez de la oferta: 15 días calendario.\n• Forma de pago: Contado / Contra entrega.\n• Tiempo de entrega: Inmediato / A coordinar.\n• Garantía de fábrica: 12 meses contra defectos de fabricación."} />
                  </div>
                  <div className="bg-[#1c1c1c] text-white p-6 rounded-2xl flex flex-col justify-center gap-4 shadow-xl">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] opacity-80 font-bold uppercase"><span>SUBTOTAL</span><span>S/ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] opacity-80 font-bold uppercase"><span>I.G.V (18%)</span><span>S/ {tax.toFixed(2)}</span></div>
                      <div className="flex justify-between text-2xl font-black text-accent pt-2 tracking-tighter uppercase"><span>TOTAL NETO</span><span>S/ {total.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t bg-slate-50">
                <Button type="submit" className="w-full h-12 uppercase font-black text-xs bg-[#d9534f] text-white shadow-xl">
                  {editingQuotation ? "Actualizar Proforma" : "Generar Proforma Maestra"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white p-4">
          <div className="relative w-full max-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por N° o Cliente..." className="pl-9 h-10 text-[10px] sm:text-xs font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div> : (
            <Table className="dense-table min-w-[700px] lg:min-w-full">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow>
                  <TableHead className="text-white font-black uppercase text-[10px]">Identificador</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Cliente / Entidad</TableHead>
                  <TableHead className="text-white text-right font-black uppercase text-[10px]">Total (S/.)</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-black text-[#d9534f] uppercase">{q.quotationNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-[10px] sm:text-[11px] truncate max-w-[200px]">{clients?.find(c => c.id === q.clientId)?.name || "---"}</TableCell>
                    <TableCell className="text-right font-black">S/ {(Number(q.total || 0)).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5",
                        q.status === "Convertido" ? "bg-status-success/10 text-status-success border-status-success/20" : 
                        q.status === "Aceptado" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        q.status === "Rechazado" ? "bg-status-error/10 text-status-error border-status-error/20" :
                        "bg-slate-50 text-slate-600"
                      )}>{q.status || "Borrador"}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {q.status !== "Convertido" && (
                          <>
                            <Button variant="ghost" size="icon" title="Convertir a OS" className="h-8 w-8 text-status-success" onClick={() => handleConvertToOrder(q)} disabled={isConverting === q.id}>
                              <Repeat className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Editar Proforma" className="h-8 w-8 text-blue-600" onClick={() => openEdit(q)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" title="Ver / Imprimir" className="h-8 w-8 text-[#d9534f]" onClick={() => setViewingQuotation(q)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Eliminar" className="h-8 w-8 text-destructive" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
