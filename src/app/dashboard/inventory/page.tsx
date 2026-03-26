"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  Wrench, 
  ShoppingCart, 
  RefreshCw,
  Boxes,
  Percent,
  CalendarClock,
  TrendingUp,
  Flame,
  Key
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const itemsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: catalog, isLoading } = useCollection(itemsRef)

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const itemData = {
      companyId: companyId,
      category: formData.get("category") as string,
      operationType: formData.get("operationType") as string,
      description: formData.get("description") as string,
      extinguishingAgent: formData.get("extinguishingAgent") as string,
      capacity: formData.get("capacity") as string,
      buyPrice: Number(formData.get("buyPrice") || 0),
      sellPrice: Number(formData.get("sellPrice") || 0),
      currentStock: Number(formData.get("currentStock") || 0),
      maxDiscount: Number(formData.get("maxDiscount") || 0),
      frequencyMonths: Number(formData.get("frequencyMonths") || 0),
      status: "Activo",
      updatedAt: new Date().toISOString()
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "all_extinguishers", editingItem.id), itemData)
      toast({ title: "Ítem actualizado" })
    } else {
      addDocumentNonBlocking(collection(db, "all_extinguishers"), { 
        ...itemData, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString() 
      })
      toast({ title: "Registrado en catálogo" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "all_extinguishers", id))
    toast({ variant: "destructive", title: "Ítem eliminado" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Catálogo de Productos y Servicios</h2>
          <p className="text-muted-foreground text-sm uppercase font-bold text-[10px] tracking-wider">Gestión especializada de inventario y tarifas.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1c1c1c] text-white h-10 font-black uppercase text-[11px] border-b-4 border-primary shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto / Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <form onSubmit={handleSaveItem} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="p-6 border-b bg-slate-50 shrink-0">
                <DialogTitle className="uppercase font-black text-primary text-xl">Configuración Técnica</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Defina los parámetros comerciales del ítem.</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Categoría</Label>
                    <Select name="category" required defaultValue={editingItem?.category || "Extintor"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Extintor">Extintor</SelectItem>
                        <SelectItem value="Gabinete">Gabinete / Soporte</SelectItem>
                        <SelectItem value="Accesorios">Accesorios / Repuestos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Tipo de Operación</Label>
                    <Select name="operationType" required defaultValue={editingItem?.operationType || "Venta"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Venta">Venta de Equipo</SelectItem>
                        <SelectItem value="Recarga">Recarga Anual</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento NTP</SelectItem>
                        <SelectItem value="Inspección">Inspección Técnica</SelectItem>
                        <SelectItem value="Alquiler">Alquiler Temporal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Descripción Detallada</Label>
                  <Input name="description" defaultValue={editingItem?.description} required placeholder="Ej. Extintor PQS 6kg ABC Industrial" className="h-10 font-bold text-xs" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Agente Extintor</Label>
                    <Input name="extinguishingAgent" defaultValue={editingItem?.extinguishingAgent} placeholder="PQS, CO2, etc." className="h-10 font-bold text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Capacidad</Label>
                    <Input name="capacity" defaultValue={editingItem?.capacity} placeholder="4kg, 6kg, 10lb..." className="h-10 font-bold text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">P. Compra</Label>
                    <Input name="buyPrice" type="number" step="0.01" defaultValue={editingItem?.buyPrice} className="h-10 font-black text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">P. Venta</Label>
                    <Input name="sellPrice" type="number" step="0.01" defaultValue={editingItem?.sellPrice} required className="h-10 font-black text-xs text-primary" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Stock</Label>
                    <Input name="currentStock" type="number" defaultValue={editingItem?.currentStock} className="h-10 font-black text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Frec. (Meses)</Label>
                    <Input name="frequencyMonths" type="number" defaultValue={editingItem?.frequencyMonths || 12} className="h-10 font-black text-xs" />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
                <Button type="submit" className="w-full bg-primary text-white font-black uppercase text-xs h-12 shadow-xl">
                  {editingItem ? "Actualizar Producto" : "Registrar Producto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardHeader className="py-3"><CardTitle className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-2"><Boxes className="h-3 w-3" /> Almacén Valorizado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-primary">S/ {catalog?.reduce((acc, curr) => acc + ((curr.buyPrice || 0) * (curr.currentStock || 0)), 0).toLocaleString()}</div></CardContent>
        </Card>
        <Card className="bg-status-success/5 border-status-success/20 shadow-none">
          <CardHeader className="py-3"><CardTitle className="text-[10px] text-status-success uppercase font-black tracking-widest flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Proyección de Venta</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-status-success">S/ {catalog?.reduce((acc, curr) => acc + ((curr.sellPrice || 0) * (curr.currentStock || 0)), 0).toLocaleString()}</div></CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 shadow-none">
          <CardHeader className="py-3"><CardTitle className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2"><ShoppingCart className="h-3 w-3" /> Ítems en Catálogo</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-black text-accent">{catalog?.length || 0}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por descripción o capacidad..." className="pl-9 h-10 text-xs font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table className="dense-table min-w-[900px]">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow>
                  <TableHead className="text-white font-black uppercase text-[10px]">Categoría</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Operación</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Descripción / Modelo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Capacidad</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-right">P. Venta</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-center">Stock</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog?.filter(i => i.description?.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50">
                        {item.category === "Extintor" && <Flame className="mr-1 h-3 w-3 text-status-error" />}
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                        {item.operationType === "Alquiler" ? <Key className="mr-1 h-2.5 w-2.5" /> : <RefreshCw className="mr-1 h-2.5 w-2.5" />}
                        {item.operationType}
                      </Badge>
                    </TableCell>
                    <TableCell><div className="font-black text-[#1c1c1c] text-[11px] uppercase">{item.description}</div></TableCell>
                    <TableCell><div className="text-[10px] font-bold text-slate-500 uppercase">{item.extinguishingAgent} • {item.capacity}</div></TableCell>
                    <TableCell className="text-right font-black text-primary">S/ {(item.sellPrice || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-black text-slate-400">{item.currentStock}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingItem(item); setIsAdding(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
