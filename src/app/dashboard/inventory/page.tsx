
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
  Bug, 
  Wrench, 
  ShoppingCart, 
  RefreshCw,
  DollarSign,
  Tag
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // Filtrar catálogo por empresa
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
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      unitPrice: Number(formData.get("unitPrice") || 0),
      unit: formData.get("unit") as string || "Und",
      description: formData.get("description") as string,
      status: "Activo",
      updatedAt: new Date().toISOString()
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "all_extinguishers", editingItem.id), itemData)
      toast({ title: "Producto/Servicio actualizado" })
    } else {
      const newItem = { ...itemData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "all_extinguishers"), newItem)
      toast({ title: "Registro exitoso en catálogo" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "all_extinguishers", id))
    toast({ variant: "destructive", title: "Ítem eliminado del catálogo" })
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Catálogo Maestro</h2>
          <p className="text-muted-foreground text-sm uppercase font-bold text-[10px] tracking-wider">Defina los ítems disponibles para sus cotizaciones oficiales.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9 font-bold uppercase text-[11px]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Ítem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveItem}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-primary">Gestión de Catálogo</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Configure un producto o servicio para usar en presupuestos.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-[10px] font-black uppercase text-slate-500">Categoría</Label>
                    <Select name="category" required defaultValue={editingItem?.category || "Venta"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Venta">Venta de Equipos</SelectItem>
                        <SelectItem value="Recarga">Servicio Recarga</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Fumigación">Fumigación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code" className="text-[10px] font-black uppercase text-slate-500">Código / SKU</Label>
                    <Input id="code" name="code" defaultValue={editingItem?.code || editingItem?.serialNumber} required placeholder="EXP-001" className="h-10 font-bold text-xs" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500">Nombre del Producto/Servicio</Label>
                  <Input id="name" name="name" defaultValue={editingItem?.name || editingItem?.type} required placeholder="Ej. Extintor PQS 10 Lbs" className="h-10 font-bold text-xs" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="unitPrice" className="text-[10px] font-black uppercase text-slate-500">Precio Unitario (S/)</Label>
                    <Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={editingItem?.unitPrice} required className="h-10 text-xs font-black" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit" className="text-[10px] font-black uppercase text-slate-500">Unidad</Label>
                    <Select name="unit" required defaultValue={editingItem?.unit || "Und"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Und">Unidad (Und)</SelectItem>
                        <SelectItem value="Serv">Servicio (Serv)</SelectItem>
                        <SelectItem value="m2">Metro Cuadrado (m2)</SelectItem>
                        <SelectItem value="Gl">Galón (Gl)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase text-slate-500">Descripción Comercial</Label>
                  <Textarea id="description" name="description" defaultValue={editingItem?.description} placeholder="Detalles que aparecerán en la cotización..." className="text-xs font-medium min-h-[80px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-[#1c1c1c] text-white font-black uppercase text-xs h-11 border-b-4 border-primary">
                  {editingItem ? "Actualizar Catálogo" : "Registrar en Catálogo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-2">
              <Package className="h-3 w-3" /> Total Ítems
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-primary">{catalog?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-status-success/5 border-status-success/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-status-success uppercase font-black tracking-widest flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Promedio de Precio
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-status-success">
              S/ {catalog?.length ? (catalog.reduce((acc, curr) => acc + (curr.unitPrice || 0), 0) / catalog.length).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2">
              <Tag className="h-3 w-3" /> Categorías Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-accent">4</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código, nombre o categoría..." 
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
              <TableHeader className="bg-[#1c1c1c] hover:bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">Cód/SKU</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Categoría</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Producto / Servicio</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px] text-right pr-10">Precio (S/.)</TableHead>
                  <TableHead className="text-white w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog?.filter(i => 
                  (i.code || i.serialNumber)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (i.name || i.type)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.category?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                    <TableCell className="font-black text-primary uppercase tracking-tight">{item.code || item.serialNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50">
                        {item.category === 'Fumigación' && <Bug className="mr-1 h-2.5 w-2.5 text-accent" />}
                        {item.category === 'Recarga' && <RefreshCw className="mr-1 h-2.5 w-2.5 text-blue-500" />}
                        {item.category === 'Venta' && <ShoppingCart className="mr-1 h-2.5 w-2.5 text-green-600" />}
                        {item.category === 'Mantenimiento' && <Wrench className="mr-1 h-2.5 w-2.5 text-orange-500" />}
                        {item.category || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1c1c1c] text-[11px] uppercase">{item.name || item.type}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold truncate max-w-[300px]">{item.description || "Sin descripción"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-primary text-right pr-10">
                      S/ {(item.unitPrice || 0).toFixed(2)} <span className="text-[9px] text-muted-foreground font-normal ml-1">/{item.unit || 'Und'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEdit(item)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {catalog?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Package className="h-12 w-12" />
                        <p className="text-[11px] font-black uppercase tracking-widest">Catálogo vacío. Registre productos para cotizar.</p>
                      </div>
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
