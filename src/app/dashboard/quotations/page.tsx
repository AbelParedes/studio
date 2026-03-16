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
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

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
    const numbers = yearQuotations.map(q => parseInt(q.quotationNumber.split("-")[1]) || 0)
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
      items: items.map(i => ({ ...i, total: Number(i.quantity || 0) * Number(i.unitPrice || 0) })),
      subtotal, tax, total,
      conditions: formData.get("conditions") as string,
      status: formData.get("status") as string || "Borrador",
      updatedAt: new Date().toISOString()
    }

    if (editingQuotation) {
      updateDocumentNonBlocking(doc(db, "quotations", editingQuotation.id), quotationData)
      toast({ title: "Proforma actualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "quotations"), { ...quotationData, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      toast({ title: "Proforma generada" })
    }
    setIsAdding(false); setEditingQuotation(null); setItems([])
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
          </div>
        </div>

        <div className="proforma-container bg-white shadow-xl mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col relative text-[#1c1c1c] border">
          {/* VISTA PREVIA PROFESIONAL SIMILAR A LA IMPLEMENTADA ANTERIORMENTE PERO RESPONSIVA */}
          <div className="p-6 sm:p-12 space-y-8 flex-1">
             <div className="flex justify-between items-start">
                <div className="h-16 w-48 relative">
                  {(company?.headerUrl || company?.logoUrl) && <Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />}
                </div>
                <div className="text-right">
                  <h1 className="text-xs sm:text-sm font-black uppercase text-primary">COTIZACIÓN COMERCIAL</h1>
                  <p className="text-[10px] font-mono font-bold mt-1">N° {viewingQuotation.quotationNumber}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px]">
                <div className="space-y-1">
                  <p className="text-slate-400 font-black uppercase">Cliente:</p>
                  <p className="font-black text-sm uppercase">{client?.name || "---"}</p>
                  <p className="font-bold">RUC: {client?.taxId || "---"}</p>
                  <p className="truncate">DIR: {client?.address || "---"}</p>
                </div>
                <div className="sm:text-right space-y-1">
                  <p className="text-slate-400 font-black uppercase">Emisión:</p>
                  <p className="font-bold">{viewingQuotation.date}</p>
                  <p className="font-black text-status-success uppercase">Estado: {viewingQuotation.status}</p>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-[11px]">
                  <thead className="bg-slate-50 border-b-2">
                    <tr>
                      <th className="p-2 text-center w-12">CANT</th>
                      <th className="p-2 text-left">DESCRIPCIÓN</th>
                      <th className="p-2 text-right w-24">UNIT (S/)</th>
                      <th className="p-2 text-right w-24">TOTAL (S/)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuotation.items?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 uppercase">{item.description}</td>
                        <td className="p-2 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-2 text-right font-black">{Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>

             <div className="flex justify-end pt-4">
                <div className="w-full sm:w-64 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold"><span>SUBTOTAL</span><span>S/ {Number(viewingQuotation.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between text-[10px] font-bold"><span>I.G.V (18%)</span><span>S/ {Number(viewingQuotation.tax).toFixed(2)}</span></div>
                  <div className="flex justify-between text-base font-black border-t-2 pt-2 text-primary"><span>TOTAL NETO</span><span>S/ {Number(viewingQuotation.total).toFixed(2)}</span></div>
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
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) { setEditingQuotation(null); setItems([]); } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#d9534f] hover:bg-[#c9302c] text-white h-10 font-bold uppercase text-xs shadow-lg w-full sm:w-auto px-8">
              <Plus className="mr-2 h-4 w-4" /> Nueva Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveQuotation} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="p-4 sm:p-6 border-b bg-slate-50">
                <DialogTitle className="uppercase font-black text-[#d9534f] text-lg">Nueva Proforma Oficial</DialogTitle>
                <DialogDescription className="text-[9px] font-bold uppercase">Sugerido: {suggestedQuotationNumber}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Cliente</Label>
                    <Select name="clientId" required>
                      <SelectTrigger className="h-10 border-2"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">N° Proforma</Label>
                    <Input name="number" defaultValue={suggestedQuotationNumber} className="h-10 uppercase font-mono font-bold" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Fecha</Label>
                    <Input type="date" name="date" defaultValue={format(new Date(), "yyyy-MM-dd")} className="h-10 font-bold" />
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
                    <Textarea name="conditions" className="min-h-[100px] text-[10px] font-medium leading-relaxed" defaultValue="• Validez: 15 días.\n• Forma de pago: Contado.\n• Garantía: 12 meses." />
                  </div>
                  <div className="bg-[#1c1c1c] text-white p-6 rounded-2xl flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-center text-[10px] font-bold opacity-60 uppercase">
                      <span>Estado</span>
                      <Select name="status" defaultValue="Borrador">
                        <SelectTrigger className="h-7 w-28 bg-white/10 border-none text-[9px] font-black"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Borrador">Borrador</SelectItem><SelectItem value="Enviado">Enviado</SelectItem><SelectItem value="Aceptado">Aceptado</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-white/10">
                      <div className="flex justify-between text-[10px] opacity-80"><span>SUBTOTAL</span><span>S/ {subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] opacity-80"><span>I.G.V (18%)</span><span>S/ {tax.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xl font-black text-accent pt-2"><span>TOTAL</span><span>S/ {total.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-6 border-t bg-slate-50">
                <Button type="submit" className="w-full h-12 uppercase font-black text-xs bg-[#d9534f] text-white shadow-xl">Generar Proforma Maestra</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por N° o Cliente..." className="pl-9 h-10 text-[10px] sm:text-xs font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div> : (
            <Table className="dense-table min-w-[700px] lg:min-w-full">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow>
                  <TableHead className="text-white">Identificador</TableHead>
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white text-right">Total (S/.)</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30">
                    <TableCell className="font-black text-[#d9534f] uppercase">{q.quotationNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-[10px] sm:text-[11px] truncate max-w-[200px]">{clients?.find(c => c.id === q.clientId)?.name || "---"}</TableCell>
                    <TableCell className="text-right font-black">S/ {(Number(q.total || 0)).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] sm:text-[9px] font-black uppercase bg-slate-50">{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {q.status !== "Convertido" && <Button variant="ghost" size="icon" className="h-8 w-8 text-status-success" onClick={() => handleConvertToOrder(q)} disabled={isConverting === q.id}><Repeat className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#d9534f]" onClick={() => setViewingQuotation(q)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, "quotations", q.id))}><Trash2 className="h-4 w-4" /></Button>
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