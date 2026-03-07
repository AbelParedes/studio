
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
  CheckCircle2,
  Download,
  MapPin,
  Phone,
  Mail,
  Globe
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
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function QuotationsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<any | null>(null)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [items, setItems] = useState<{description: string, quantity: number, unitPrice: number}[]>([])

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
      quantity: i.quantity || 1, 
      unitPrice: i.unitPrice || 0 
    })) || [])
    setIsAdding(true)
  }

  if (viewingQuotation) {
    const client = clients?.find(c => c.id === viewingQuotation.clientId)
    const defaultLogo = PlaceHolderImages.find(img => img.id === 'apeva-logo')?.imageUrl || "https://picsum.photos/seed/apeva/200/100"
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
              <Download className="mr-2 h-3 w-3" /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="bg-white p-0 shadow-2xl mx-auto print-page w-[210mm] min-h-[297mm] flex flex-col relative overflow-hidden text-slate-900 border" id="quotation-print-area">
          
          <div className="pt-8 px-10 pb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="relative h-20 w-44 shrink-0">
                <Image 
                  src={company?.logoUrl || defaultLogo} 
                  alt="Logo" 
                  fill 
                  className="object-contain object-left"
                  unoptimized
                />
              </div>
              <div className="text-center flex-1">
                <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase leading-none">SISTEMA DE EXTINTORES</h1>
                <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1 uppercase">EQUIPOS CONTRA INCENDIO - SANEAMIENTO AMBIENTAL</p>
              </div>
            </div>

            <div className="bg-slate-100 py-2 px-4 rounded border flex flex-wrap justify-center gap-x-6 gap-y-1 text-[8px] font-bold text-slate-600 uppercase mb-6">
              <div className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5 text-red-600" /> {company?.address || "DIRECCIÓN DE LA EMPRESA"}</div>
              <div className="flex items-center gap-1"><Phone className="h-2.5 w-2.5 text-red-600" /> {company?.phone || "TELÉFONOS"}</div>
              <div className="flex items-center gap-1"><Mail className="h-2.5 w-2.5 text-red-600" /> {company?.email || "EMAIL"}</div>
              <div className="flex items-center gap-1"><Globe className="h-2.5 w-2.5 text-red-600" /> {company?.website || "WWW.SISTEMADEEXTINTORES.COM"}</div>
            </div>

            <div className="bg-red-600 py-3 rounded-full text-center shadow-md mb-4">
              <h2 className="text-xl font-black text-white uppercase tracking-widest">
                PROFORMA N° {viewingQuotation.quotationNumber}
              </h2>
            </div>

            <div className="text-right text-[10px] font-bold text-slate-700 uppercase pr-4">
              LIMA, {viewingQuotation.date ? format(new Date(viewingQuotation.date), "dd 'de' MMMM 'de' yyyy", { locale: es }) : "---"}
            </div>
          </div>

          <div className="px-10 space-y-6 flex-1">
            <div className="space-y-2">
              <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">DATOS DE CLIENTE</h3>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-[10px] border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 p-2 font-black uppercase w-40 border-r border-slate-200">N° DOCUMENTO:</td>
                      <td className="p-2 font-bold uppercase">{client?.taxId || "---"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 p-2 font-black uppercase border-r border-slate-200">CLIENTE:</td>
                      <td className="p-2 font-bold uppercase">{client?.name || "---"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 p-2 font-black uppercase border-r border-slate-200">DIRECCIÓN:</td>
                      <td className="p-2 font-bold uppercase">{client?.address || "---"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 p-2 font-black uppercase border-r border-slate-200">CELULAR:</td>
                      <td className="p-2 font-bold uppercase">{client?.phone || "---"}</td>
                    </tr>
                    <tr className="">
                      <td className="bg-slate-50 p-2 font-black uppercase border-r border-slate-200">NOMBRE COMERCIAL:</td>
                      <td className="p-2 font-bold uppercase">{client?.legalName || client?.name || "---"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">EXTINTORES</h3>
              <div className="flex gap-20 pl-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-600" />
                  <span className="text-[11px] font-black uppercase text-slate-700">VENTA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-600" />
                  <span className="text-[11px] font-black uppercase text-slate-700">RECARGA</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-black text-red-600 uppercase tracking-widest">DETALLE DE SERVICIO</h3>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-[10px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left font-black uppercase border-r border-slate-300 w-16">CANT.</th>
                      <th className="p-2 text-left font-black uppercase border-r border-slate-300">DESCRIPCIÓN</th>
                      <th className="p-2 text-right font-black uppercase border-r border-slate-300 w-28">P. UNIT.</th>
                      <th className="p-2 text-right font-black uppercase w-28">SUB TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuotation.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="p-2 font-bold text-center border-r border-slate-200">{item.quantity || 0}</td>
                        <td className="p-2 font-bold uppercase border-r border-slate-200">{item.description || "---"}</td>
                        <td className="p-2 text-right font-bold border-r border-slate-200">S/. {(Number(item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="p-2 text-right font-black">S/. {(Number(item.total || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} className="p-2 font-black uppercase bg-slate-50 italic border-r border-slate-300">El servicio será pagado al CONTADO.</td>
                      <td className="p-2 text-right font-black uppercase bg-slate-50 border-r border-slate-300">COSTO TOTAL</td>
                      <td className="p-2 text-right font-black text-red-600 bg-slate-50">S/. {(Number(viewingQuotation.total || 0)).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <div className="flex border-b border-slate-300">
                <div className="w-40 bg-slate-50 p-2 font-black uppercase text-[10px] border-r border-slate-300">OBSERVACIÓN:</div>
                <div className="flex-1 p-2"></div>
              </div>
              <div className="grid grid-cols-2">
                <div className="flex border-r border-slate-300">
                  <div className="w-40 bg-slate-50 p-2 font-black uppercase text-[10px] border-r border-slate-300">FECHA ENTREGA:</div>
                  <div className="flex-1 p-2 text-center font-bold text-[10px]">{viewingQuotation.date || "---"}</div>
                </div>
                <div className="flex">
                  <div className="w-40 bg-slate-50 p-2 font-black uppercase text-[10px] border-r border-slate-300">HORA ENTREGA:</div>
                  <div className="flex-1 p-2 text-center font-bold text-[10px]">09:00 AM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-10 pt-20">
            <div className="grid grid-cols-2 gap-20 mb-12">
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-dashed border-slate-400 mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-500">AGENTE</p>
                <p className="text-[10px] font-black uppercase">{profiles?.[0]?.name || "ADMINISTRADOR"}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-dashed border-slate-400 mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-500">CLIENTE</p>
                <p className="text-[10px] font-black uppercase">{client?.name || "CLIENTE GENERAL"}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="h-16 w-16 border bg-slate-50 flex items-center justify-center p-1 rounded">
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-black uppercase text-slate-400 text-center">QR VALIDACIÓN</div>
              </div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest opacity-40">EXTINTORES APEVA SAAS © {currentYear}</p>
            </div>
          </div>

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Gestión de Ventas</h2>
          <p className="text-muted-foreground text-sm italic font-medium">Genere proformas oficiales tipo SIEXT de alta seguridad.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white h-10 font-bold uppercase text-xs px-6 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nueva Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveQuotation}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-red-600 text-xl tracking-tight">Emisión de Proforma Oficial</DialogTitle>
                <DialogDescription className="text-xs font-bold text-slate-500 uppercase">Ajuste automático de correlativo e IGV 18%.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente Receptante</Label>
                    <Select name="clientId" defaultValue={editingQuotation?.clientId} required>
                      <SelectTrigger className="h-10 border-red-100 focus:ring-red-500">
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
                    <Label className="text-[10px] font-black uppercase text-slate-500">N° Proforma (Correlativo)</Label>
                    <Input name="number" defaultValue={editingQuotation?.quotationNumber || suggestedQuotationNumber} placeholder="000466" className="h-10 uppercase font-mono font-bold border-red-100" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Estado Operativo</Label>
                    <Select name="status" defaultValue={editingQuotation?.status || "Borrador"}>
                      <SelectTrigger className="h-10 border-red-100">
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
                  <div className="flex items-center justify-between border-b border-red-100 pb-2">
                    <Label className="text-[11px] font-black uppercase text-red-600 tracking-wider">Detalle de Equipos / Servicios</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-[10px] font-bold uppercase bg-slate-900 text-white hover:bg-slate-800">
                      <Plus className="h-3 w-3 mr-2" /> Agregar Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-xl bg-slate-50/50 shadow-sm border-slate-200">
                        <div className="col-span-12 md:col-span-6 grid gap-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Descripción Técnica</Label>
                          <Input 
                            value={item.description} 
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="Ej. EXTINTOR PQS ABC 10 LBS..."
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
                          <Label className="text-[9px] font-black uppercase text-slate-500">P. Unitario (S/)</Label>
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
                          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-10 w-10 text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-600 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-red-200 mb-1">Costo Total Neto</p>
                    <p className="text-3xl font-black text-white tracking-tighter">
                      S/. {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 1.18).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center md:items-end text-[10px] font-bold text-red-100">
                    <p>Subtotal: S/. {items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0).toFixed(2)}</p>
                    <p>I.G.V. (18%): S/. {(items.reduce((acc, i) => acc + (Number(i.quantity || 0) * Number(i.unitPrice || 0)), 0) * 0.18).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t pt-6">
                <Button type="submit" className="w-full h-12 uppercase font-black text-xs tracking-widest bg-slate-900 hover:bg-black">
                  {editingQuotation ? "Actualizar Proforma" : "Emitir Proforma SIEXT"}
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
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-slate-900 hover:bg-slate-900">
                <TableRow className="border-none">
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">N° PROFORMA</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">CLIENTE</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px] text-right pr-6">TOTAL (S/.)</TableHead>
                  <TableHead className="text-white h-12 font-black uppercase text-[10px]">ESTADO</TableHead>
                  <TableHead className="text-white h-12 text-right pr-6 font-black uppercase text-[10px]">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations?.filter(q => 
                  q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  clients?.find(c => c.id === q.clientId)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((q) => {
                  const client = clients?.find(c => c.id === q.clientId)
                  return (
                    <TableRow key={q.id} className="hover:bg-red-50/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-red-600 uppercase tracking-tight">{q.quotationNumber}</TableCell>
                      <TableCell className="font-bold uppercase text-[11px] text-slate-700">{client?.name || "---"}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-slate-900">S/. {(Number(q.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
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
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => setViewingQuotation(q)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:bg-slate-100" onClick={() => openEdit(q)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
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
