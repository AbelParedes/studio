
"use client"

import { useState } from "react"
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
  Phone, 
  Globe, 
  MapPin, 
  ArrowLeft,
  MousePointer2,
  Flame,
  CheckCircle2,
  Download
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

  // 1. Contexto de Empresa
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

  // 3. Lógica de Formulario
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
    const tax = subtotal * 0.18 // IGV 18%
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
      toast({ title: "Cotización actualizada" })
    } else {
      const newId = crypto.randomUUID()
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: newId, createdAt: new Date().toISOString() })
      toast({ title: "Cotización generada" })
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

  const openEdit = (q: any) => {
    setEditingQuotation(q)
    setItems(q.items.map((i: any) => ({ 
      description: i.description, 
      quantity: i.quantity, 
      unitPrice: i.unitPrice 
    })))
    setIsAdding(true)
  }

  // 4. Renderizado de Vista de Impresión (Membretada Oficial Apeva)
  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    const defaultLogoUrl = PlaceHolderImages.find(img => img.id === 'apeva-logo')?.imageUrl || "https://res.cloudinary.com/djz39v86m/image/upload/v1711100000/apeva-logo.png"
    const finalLogoSrc = company?.logoUrl || defaultLogoUrl

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between no-print mb-6">
          <Button variant="ghost" onClick={() => setViewingQuotation(null)} className="font-bold uppercase text-xs text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Listado
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint} className="font-bold uppercase text-xs">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handlePrint} className="bg-primary text-white font-bold uppercase text-xs">
              <Download className="mr-2 h-4 w-4" /> Exportar a PDF
            </Button>
          </div>
        </div>

        {/* CONTENEDOR A4 OFICIAL APEVA */}
        <div className="bg-white p-0 shadow-2xl mx-auto print-container max-w-[21cm] min-h-[29.7cm] flex flex-col relative overflow-hidden text-slate-900 border border-slate-200">
          
          {/* HEADER MEMBRETADO */}
          <div className="pt-8 px-10 pb-4">
            <div className="flex justify-between items-start">
              <div className="relative h-28 w-80 shrink-0">
                {finalLogoSrc && (
                  <Image 
                    src={finalLogoSrc} 
                    alt="Logotipo Extintores Apeva" 
                    fill 
                    className="object-contain"
                    unoptimized={!!company?.logoUrl}
                  />
                )}
              </div>

              <div className="text-right flex flex-col items-end pt-4">
                <div className="border-[3px] border-red-600 p-4 rounded-xl bg-slate-50 min-w-[220px] shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">R.U.C. {company?.taxId || "20602345678"}</p>
                  <p className="text-sm font-black uppercase text-red-600 mb-1">PROFORMA / COTIZACIÓN</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{viewingQuotation.quotationNumber}</p>
                </div>
                <p className="text-[10px] mt-3 font-bold text-slate-500 uppercase tracking-tighter">FECHA DE EMISIÓN: {viewingQuotation.date}</p>
              </div>
            </div>
          </div>

          <div className="px-10 mt-2">
            <div className="h-[3px] bg-red-600 w-full mb-[2px]"></div>
            <div className="h-[1px] bg-orange-500 w-full opacity-50"></div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div className="p-10 flex-1 flex flex-col">
            <div className="grid grid-cols-1 mb-8">
              <div className="space-y-1.5 p-5 border border-slate-200 border-l-[6px] border-l-red-600 bg-slate-50/50 rounded-r-xl">
                <p className="font-black uppercase text-slate-400 text-[9px] tracking-widest mb-2 flex items-center">
                   <MousePointer2 className="h-3 w-3 mr-1 text-red-600" />
                   INFORMACIÓN DEL CLIENTE:
                </p>
                <p className="font-black text-lg uppercase text-slate-800">{client?.name || "CLIENTE GENERAL"}</p>
                <div className="h-px bg-slate-200 w-full my-2"></div>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <p className="font-bold text-slate-700">RUC / DNI: <span className="font-mono bg-white px-1 border rounded ml-2">{client?.taxId || "---"}</span></p>
                  <p className="font-bold text-slate-700">CIUDAD: <span className="font-medium ml-2">LIMA, PERÚ</span></p>
                </div>
                <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-2">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-red-600" />
                  <span className="font-medium">{client?.address || "DIRECCIÓN NO REGISTRADA"}</span>
                </div>
              </div>
            </div>

            {/* TABLA DE SERVICIOS */}
            <div className="flex-1">
              <Table className="border rounded-xl overflow-hidden border-slate-200 shadow-sm w-full">
                <TableHeader className="bg-slate-800 hover:bg-slate-800">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-black uppercase text-[10px] tracking-wider py-5 pl-6">DESCRIPCIÓN DEL EQUIPO O SERVICIO</TableHead>
                    <TableHead className="text-center text-white font-black uppercase text-[10px] tracking-wider py-5 w-24">CANT.</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-5 w-32">P. UNIT (S/)</TableHead>
                    <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-wider py-5 w-32 pr-6">TOTAL (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingQuotation.items.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50">
                      <TableCell className="font-bold uppercase text-[11px] py-5 pl-6 text-slate-700">
                        <div className="flex items-center gap-3">
                           <span className="h-5 w-5 rounded bg-red-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">{idx + 1}</span>
                           {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-[11px] py-5">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-[11px] py-5">{(Number(item.unitPrice) || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-black text-[11px] py-5 text-red-600 pr-6">{(Number(item.total) || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Espacio para que la tabla siempre tenga una altura mínima y se vea bien en A4 */}
                  {Array.from({ length: Math.max(0, 8 - (viewingQuotation.items?.length || 0)) }).map((_, i) => (
                    <TableRow key={`empty-${i}`} className="border-b border-slate-50 border-none h-12">
                      <TableCell colSpan={4}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* RESUMEN DE TOTALES */}
            <div className="mt-8 flex justify-between items-end gap-10">
              <div className="flex-1 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-[10px] font-black uppercase text-red-600 tracking-widest flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    NOTAS Y CONDICIONES COMERCIALES
                  </p>
                  <ul className="text-[9px] text-slate-600 space-y-1 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Los extintores cumplen con la norma técnica peruana NTP 350.043.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Garantía de 01 año contra defectos de fabricación.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Instalación y capacitación de uso básico gratuita en Lima.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-2.5 w-2.5 text-green-600" /> Tiempo de entrega: Inmediato / A convenir.</li>
                  </ul>
                </div>
              </div>
              
              <div className="w-80 space-y-2 bg-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-400">SUBTOTAL</span>
                  <span className="font-black text-white">S/ {(Number(viewingQuotation.subtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold uppercase text-slate-400">I.G.V. (18%)</span>
                  <span className="font-black text-white">S/ {(Number(viewingQuotation.tax) || 0).toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-700 my-2"></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-black uppercase text-red-500 text-sm tracking-widest">TOTAL NETO</span>
                  <span className="font-black text-white text-2xl tracking-tighter">S/ {(Number(viewingQuotation.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* FIRMAS */}
            <div className="mt-20 grid grid-cols-2 gap-20">
              <div className="flex flex-col items-center">
                <div className="w-56 h-px bg-slate-400 mb-2"></div>
                <p className="text-[10px] font-black uppercase text-slate-400">ACEPTACIÓN DEL CLIENTE</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-56 h-px bg-red-600 mb-2"></div>
                <p className="text-[10px] font-black uppercase text-red-600">DEPARTAMENTO DE VENTAS</p>
                <p className="text-[9px] font-bold text-slate-500 italic uppercase">Extintores Apeva SAC</p>
              </div>
            </div>
          </div>

          {/* FOOTER AMARILLO OFICIAL APEVA */}
          <div className="bg-[#ffdd00] py-10 px-10 no-print-bg mt-auto border-t-[6px] border-red-600 footer-apeva">
            <div className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-2 gap-x-20 gap-y-4 w-full max-w-2xl mx-auto text-black">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                  <MapPin className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{company?.address || "Av. Naranjal 215 int A 06 Independencia - Lima"}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                  <Phone className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{company?.phone || "933 261 752 / 918 790 212"}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                  <Mail className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="lowercase">{company?.email || "extintoresapeva@hotmail.com"}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase">
                  <Globe className="h-4 w-4 text-red-600 shrink-0" />
                  <span className="lowercase">www.extintoresapeva.com</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-red-700 tracking-[0.5em] mt-4 opacity-80 uppercase">SEGURIDAD • GARANTÍA • CONFIANZA</p>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              header, aside, .no-print {
                display: none !important;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border: none;
                background-color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .footer-apeva {
                background-color: #ffdd00 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // 5. Listado Principal
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Ventas y Proformas</h2>
          <p className="text-muted-foreground text-sm">Emita presupuestos oficiales con el formato corporativo de Apeva.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs px-6 shadow-md hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Generar Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveQuotation}>
              <DialogHeader>
                <DialogTitle className="uppercase font-bold text-primary">Configuración de Proforma</DialogTitle>
                <DialogDescription className="text-xs uppercase font-medium">Los precios incluyen IGV del 18% automáticamente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Cliente Receptor</Label>
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
                    <Label className="text-[10px] font-bold uppercase">N° de Cotización</Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber} placeholder="COT-001-2024" className="uppercase font-mono" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase">Estado Inicial</Label>
                    <Select name="status" defaultValue={editingQuotation?.status || "Borrador"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Borrador">Borrador</SelectItem>
                        <SelectItem value="Enviado">Enviado al Cliente</SelectItem>
                        <SelectItem value="Aceptado">Aceptado / O.C.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Label className="text-[11px] font-black uppercase text-primary">Items del Presupuesto</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase bg-accent text-white hover:bg-accent/90">
                      <Plus className="h-3 w-3 mr-2" /> Agregar Servicio / Equipo
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-xl bg-slate-50 shadow-sm animate-in slide-in-from-right-2">
                        <div className="col-span-12 md:col-span-6 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Descripción Técnica</Label>
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="Ej. Recarga de Extintor PQS ABC 10 Lbs..."
                            className="h-9 text-xs font-bold"
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
                            className="h-9 text-xs text-center font-black"
                            required
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Precio Unit. (S/)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="h-9 text-xs text-right font-black"
                            required
                          />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex justify-center">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {items.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase">No has añadido items a la proforma</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Estimado Neto (Incl. IGV)</p>
                    <p className="text-3xl font-black text-red-500 tracking-tighter">
                      S/ {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 1.18).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center md:items-end text-[11px] font-bold opacity-80">
                    <p>Subtotal: S/ {items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0).toFixed(2)}</p>
                    <p>I.G.V. (18%): S/ {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 0.18).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t pt-6">
                <Button type="submit" className="w-full h-11 uppercase font-black text-xs tracking-widest bg-primary hover:bg-primary/90">
                  {editingQuotation ? "Actualizar Proforma" : "Confirmar y Generar Cotización"}
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
              placeholder="Buscar por número o cliente..." 
              className="pl-9 h-9 text-xs font-bold uppercase" 
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
                  <TableHead className="text-white">N° Proforma</TableHead>
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
                    <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-primary uppercase tracking-tighter">{q.quotationNumber}</TableCell>
                      <TableCell className="font-black uppercase text-[11px]">{client?.name || "Desconocido"}</TableCell>
                      <TableCell className="text-[11px] font-bold text-slate-500">{q.date}</TableCell>
                      <TableCell className="font-black text-slate-900">S/ {(Number(q.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase px-2",
                          q.status === "Aceptado" && "bg-green-50 text-green-700 border-green-200"
                        )}>
                          {q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Ver Membretado" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setViewingQuotation(q)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(q)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {quotations?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                      No hay cotizaciones registradas en su organización.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
