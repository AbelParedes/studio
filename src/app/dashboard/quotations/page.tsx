
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
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ArrowLeft,
  MousePointer2,
  Flame,
  CheckCircle2,
  Download,
  FileText,
  Info
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
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number}[]>([])

  // 1. Obtener contexto de usuario y empresa
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const companyRef = useMemoFirebase(() => 
    companyId ? doc(db, "companies", companyId) : null,
  [db, companyId])
  const { data: company } = useDoc(companyRef)

  // 2. Cargar datos de negocio
  const quotationsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "quotations"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: quotations, isLoading } = useCollection(quotationsRef)

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients } = useCollection(clientsRef)

  // 3. Lógica de gestión de items
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
    const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)
    const tax = subtotal * 0.18
    const total = subtotal + tax

    const quotationData = {
      companyId: companyId,
      clientId: formData.get("clientId") as string,
      quotationNumber: formData.get("number") as string || `COT-${Date.now().toString().slice(-6)}`,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      items: items.map(i => ({ ...i, total: Number(i.quantity || 0) * Number(i.unitPrice || 0) })),
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
      quantity: i.quantity, 
      unitPrice: i.unitPrice 
    })) || [])
    setIsAdding(true)
  }

  // 4. Vista de Impresión / PDF (Fidelidad A4 Refinada)
  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'apeva-logo')?.imageUrl || "https://res.cloudinary.com/djz39v86m/image/upload/v1711100000/apeva-logo.png"
    
    const headerSrc = company?.headerUrl || company?.logoUrl || defaultLogo
    const footerSrc = company?.footerUrl || null

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between no-print mb-4">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-[10px] text-primary hover:bg-primary/5">
            <ArrowLeft className="mr-2 h-3 w-3" /> Volver al Listado
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="font-bold uppercase text-[10px] border-primary text-primary h-8">
              <Printer className="mr-2 h-3 w-3" /> Imprimir
            </Button>
            <Button onClick={handlePrint} className="bg-primary text-white font-bold uppercase text-[10px] h-8 shadow-md">
              <Download className="mr-2 h-3 w-3" /> Exportar PDF
            </Button>
          </div>
        </div>

        {/* CONTENEDOR A4 REFINADO */}
        <div className="bg-white p-0 shadow-xl mx-auto print-page w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden text-slate-800 border border-slate-100" id="quotation-print-area">
          
          {/* HEADER SECCIÓN MÁS COMPACTA */}
          <div className="pt-6 px-10 pb-3">
            <div className="flex justify-between items-start">
              <div className="relative h-20 w-64 shrink-0">
                <Image 
                  src={headerSrc} 
                  alt="Cabecera Corporativa" 
                  fill 
                  className="object-contain object-left"
                  unoptimized
                />
              </div>

              <div className="text-right flex flex-col items-end pt-2">
                <div className="border-2 border-red-600 p-3 rounded-lg bg-slate-50 min-w-[200px]">
                  <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider mb-0.5">R.U.C. {company?.taxId || "20602345678"}</p>
                  <p className="text-[11px] font-black uppercase text-red-600 mb-0.5 tracking-tight">PROFORMA / COTIZACIÓN</p>
                  <p className="text-lg font-black text-slate-900 tracking-tighter">{viewingQuotation.quotationNumber}</p>
                </div>
                <p className="text-[9px] mt-2 font-bold text-slate-500 uppercase">FECHA: {viewingQuotation.date}</p>
              </div>
            </div>
          </div>

          <div className="px-10">
            <div className="h-[2px] bg-red-600 w-full mb-[1px]"></div>
            <div className="h-[1px] bg-slate-900 w-full opacity-10"></div>
          </div>

          {/* CUERPO REFINADO */}
          <div className="p-10 flex-1 flex flex-col">
            <div className="mb-6">
              <div className="p-4 border border-slate-100 border-l-4 border-l-red-600 bg-slate-50/30 rounded-r-lg">
                <p className="font-bold uppercase text-slate-400 text-[8px] tracking-widest mb-1.5 flex items-center">
                   <MousePointer2 className="h-2.5 w-2.5 mr-1 text-red-600" />
                   CLIENTE:
                </p>
                <p className="font-black text-base uppercase text-slate-900 leading-tight">{client?.name || "CLIENTE GENERAL"}</p>
                <div className="h-[1px] bg-slate-200 w-full my-1.5"></div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                  <p className="text-slate-700">RUC / DNI: <span className="ml-1 text-slate-900">{client?.taxId || "---"}</span></p>
                  <p className="text-slate-700">LUGAR: <span className="ml-1 text-slate-900">LIMA, PERÚ</span></p>
                </div>
                <div className="flex items-start gap-1 text-[10px] text-slate-600 mt-1">
                  <MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0 text-red-600" />
                  <span className="font-medium">{client?.address || "DIRECCIÓN NO REGISTRADA"}</span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <Table className="border border-slate-200 w-full rounded-sm overflow-hidden">
                <TableHeader className="bg-slate-900 hover:bg-slate-900">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-bold uppercase text-[9px] py-3 pl-4">DESCRIPCIÓN DEL SERVICIO</TableHead>
                    <TableHead className="text-center text-white font-bold uppercase text-[9px] py-3 w-16">CANT.</TableHead>
                    <TableHead className="text-right text-white font-bold uppercase text-[9px] py-3 w-24">P. UNIT</TableHead>
                    <TableHead className="text-right text-white font-bold uppercase text-[9px] py-3 w-24 pr-4">TOTAL (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingQuotation.items?.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-100 last:border-none hover:bg-transparent">
                      <TableCell className="font-bold uppercase text-[10px] py-2.5 pl-4 text-slate-800">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center font-bold text-[10px] py-2.5">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-[10px] py-2.5">{(Number(item.unitPrice) || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black text-[10px] py-2.5 text-red-600 pr-4">{(Number(item.total) || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* TOTALES MÁS COMPACTOS */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="flex-1 space-y-3 w-full max-w-sm">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="text-[9px] font-black uppercase text-red-600 tracking-widest flex items-center mb-1.5">
                    <Flame className="h-2.5 w-2.5 mr-1" />
                    CONDICIONES TÉCNICAS
                  </p>
                  <ul className="text-[8px] text-slate-600 space-y-0.5 font-bold uppercase leading-tight">
                    <li>• CUMPLIMIENTO NORMATIVO NTP 350.043 E INDECI.</li>
                    <li>• GARANTÍA DE FÁBRICA DE 01 AÑO.</li>
                    <li>• INCLUYE PRECINTO Y TARJETA DE CONTROL.</li>
                  </ul>
                </div>
              </div>
              
              <div className="w-full md:w-64 space-y-1.5 bg-slate-900 p-4 rounded-xl shadow-lg">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase text-slate-400">SUBTOTAL</span>
                  <span className="font-black text-white">S/ {(Number(viewingQuotation.subtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold uppercase text-slate-400">I.G.V. (18%)</span>
                  <span className="font-black text-white">S/ {(Number(viewingQuotation.tax) || 0).toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-slate-700 my-1"></div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="font-black uppercase text-red-500 text-[10px] tracking-widest">TOTAL</span>
                  <span className="font-black text-white text-xl tracking-tighter">S/ {(Number(viewingQuotation.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* FIRMAS REFINADAS */}
            <div className="mt-16 grid grid-cols-2 gap-20">
              <div className="flex flex-col items-center">
                <div className="w-40 h-[1px] bg-slate-300 mb-1.5"></div>
                <p className="text-[8px] font-black uppercase text-slate-400">RECIBIDO POR</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-40 h-[1px] bg-red-600 mb-1.5"></div>
                <p className="text-[8px] font-black uppercase text-red-600">DEPARTAMENTO TÉCNICO</p>
                <p className="text-[7px] font-bold text-slate-500 uppercase">{company?.name || "EXTINTORES APEVA"}</p>
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA MÁS PEQUEÑO Y REFINADO */}
          <div className={cn("mt-auto print-footer w-full relative", footerSrc ? "p-0" : "bg-[#ffdd00] py-4 px-10 border-t-[3px] border-red-600")}>
            {footerSrc ? (
              <div className="relative h-24 w-full">
                <Image src={footerSrc} alt="Pie de Página Oficial" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 w-full text-slate-900 font-black text-[8px] uppercase">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-2.5 w-2.5 text-red-600" />
                    <span>{company?.address || "LIMA, PERÚ"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-2.5 w-2.5 text-red-600" />
                    <span>{company?.phone || "CENTRAL APEVA"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-2.5 w-2.5 text-red-600" />
                    <span className="lowercase">{company?.email || "contacto@extintoresapeva.com"}</span>
                  </div>
                </div>
                <p className="text-[7px] font-black text-red-800 tracking-[0.3em] opacity-70 uppercase">SEGURIDAD • GARANTÍA • CONFIANZA</p>
              </div>
            )}
          </div>

          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              #quotation-print-area, #quotation-print-area * { visibility: visible; }
              #quotation-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-footer {
                position: absolute !important;
                bottom: 0 !important;
                width: 100% !important;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Gestión de Ventas</h2>
          <p className="text-muted-foreground text-sm">Emita proformas oficiales con el respaldo de seguridad Apeva.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white h-10 font-bold uppercase text-xs px-6 shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Nueva Proforma
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSaveQuotation}>
                <DialogHeader>
                  <DialogTitle className="uppercase font-black text-primary">Generador de Presupuesto</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-500 uppercase">Cálculos con I.G.V. 18% automático.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Cliente / Organización</Label>
                      <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                        <SelectTrigger className="h-10">
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
                      <Label className="text-[10px] font-black uppercase text-slate-500">N° de Cotización</Label>
                      <Input name="number" defaultValue={editingQuotation?.quotationNumber} placeholder="COT-XXXX-2024" className="h-10 uppercase font-mono font-bold" />
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
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <Label className="text-[11px] font-black uppercase text-primary">Ítems de Servicio / Productos</Label>
                      <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase bg-accent text-white">
                        <Plus className="h-3 w-3 mr-2" /> Agregar Línea
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-xl bg-slate-50 shadow-sm border-slate-200">
                          <div className="col-span-12 md:col-span-6 grid gap-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500">Descripción del Equipo o Servicio</Label>
                            <Input 
                              value={item.description} 
                              onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              placeholder="Ej. Recarga Extintor PQS 10 Lbs..."
                              className="h-10 text-xs font-bold"
                              required
                            />
                          </div>
                          <div className="col-span-4 md:col-span-2 grid gap-1.5">
                            <Label className="text-[9px] font-black uppercase text-slate-500">Cant.</Label>
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
                            <Label className="text-[9px] font-black uppercase text-slate-500">Unit. (S/)</Label>
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Neto (con IGV)</p>
                      <p className="text-3xl font-black text-red-500 tracking-tighter">
                        S/ {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 1.18).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end text-[10px] font-bold opacity-70">
                      <p>Subtotal: S/ {items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0).toFixed(2)}</p>
                      <p>I.G.V. (18%): S/ {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 0.18).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="border-t border-slate-200 pt-6">
                  <Button type="submit" className="w-full h-12 uppercase font-black text-xs tracking-widest bg-primary hover:bg-primary/90">
                    {editingQuotation ? "Actualizar Proforma" : "Generar Proforma"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  <TableHead className="text-white h-12 font-black">N° PROFORMA</TableHead>
                  <TableHead className="text-white h-12 font-black">CLIENTE</TableHead>
                  <TableHead className="text-white h-12 font-black text-right pr-6">TOTAL (S/)</TableHead>
                  <TableHead className="text-white h-12 font-black">ESTADO</TableHead>
                  <TableHead className="text-white h-12 text-right pr-6 font-black">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations?.filter(q => 
                  q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  clients?.find(c => c.id === q.clientId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((q) => {
                  const client = clients?.find(c => c.id === q.clientId)
                  return (
                    <TableRow key={q.id} className="hover:bg-slate-50 border-slate-100">
                      <TableCell className="font-black text-primary uppercase tracking-tighter">{q.quotationNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px] text-slate-700">{client?.name || "CARGA..."}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-slate-900">S/ {(q.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5",
                          q.status === "Aceptado" ? "bg-green-50 text-green-700 border-green-200" : 
                          q.status === "Enviado" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => setViewingQuotation(q)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(q)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}>
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
