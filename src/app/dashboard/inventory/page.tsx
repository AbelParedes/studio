
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Plus, Search, Loader2, Trash2, Edit2, Flame, Bug, Tool, ShoppingCart, RefreshCw } from "lucide-react"
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

  // Filtrar inventario por empresa
  const extinguishersRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "all_extinguishers"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: inventory, isLoading } = useCollection(extinguishersRef)

  const handleSaveEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const equipmentData = {
      companyId: companyId,
      serialNumber: formData.get("serial") as string,
      type: formData.get("type") as string,
      size: formData.get("size") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as string || "Operativo",
      lastService: formData.get("lastService") as string || new Date().toISOString().split('T')[0],
      nextDue: formData.get("nextDue") as string || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      category: formData.get("category") as string,
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "all_extinguishers", editingItem.id), equipmentData)
      toast({ title: "Registro actualizado" })
    } else {
      const newEquip = { ...equipmentData, id: crypto.randomUUID() }
      addDocumentNonBlocking(collection(db, "all_extinguishers"), newEquip)
      toast({ title: "Registro exitoso" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "all_extinguishers", id))
    toast({ variant: "destructive", title: "Registro removido" })
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    setIsAdding(true)
  }

  const stats = {
    operativos: inventory?.filter(i => i.status === "Operativo").length || 0,
    mantenimiento: inventory?.filter(i => i.status === "Mantenimiento").length || 0,
    vencidos: inventory?.filter(i => i.status === "Vencido").length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Catálogo de Productos y Servicios</h2>
          <p className="text-muted-foreground text-sm uppercase font-bold text-[10px] tracking-wider">Gestión de Venta, Recarga, Mantenimiento y Fumigaciones.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9 font-bold uppercase text-[11px]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveEquipment}>
              <DialogHeader>
                <DialogTitle className="uppercase font-black text-primary">Gestión Operativa</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Registre equipos o servicios técnicos para su organización.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase text-slate-500">Categoría del Servicio</Label>
                  <Select name="category" required defaultValue={editingItem?.category || "Extintores"}>
                    <SelectTrigger className="h-10 text-xs font-bold">
                      <SelectValue placeholder="Seleccione Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venta">Venta de Equipos</SelectItem>
                      <SelectItem value="Recarga">Recarga de Extintores</SelectItem>
                      <SelectItem value="Mantenimiento">Mantenimiento Técnico</SelectItem>
                      <SelectItem value="Fumigación">Fumigación General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serial" className="text-[10px] font-black uppercase text-slate-500">Código / N° Serie / Lote</Label>
                  <Input id="serial" name="serial" defaultValue={editingItem?.serialNumber} required placeholder="REF-XXXXXX" className="h-10 font-bold text-xs" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type" className="text-[10px] font-black uppercase text-slate-500">Tipo / Agente / Servicio</Label>
                    <Select name="type" required defaultValue={editingItem?.type || "PQS ABC"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PQS ABC">PQS ABC</SelectItem>
                        <SelectItem value="CO2">CO2 (Bióxido de Carbono)</SelectItem>
                        <SelectItem value="K-Class">K-Class (Cocinas)</SelectItem>
                        <SelectItem value="Agua">Agua Presurizada</SelectItem>
                        <SelectItem value="Acetato">Acetato de Potasio</SelectItem>
                        <SelectItem value="Desinsectación">Desinsectación</SelectItem>
                        <SelectItem value="Desratización">Desratización</SelectItem>
                        <SelectItem value="Desinfección">Desinfección COVID/Ambiental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="text-[10px] font-black uppercase text-slate-500">Estado</Label>
                    <Select name="status" required defaultValue={editingItem?.status || "Operativo"}>
                      <SelectTrigger className="h-10 text-xs font-bold">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operativo">Activo / Operativo</SelectItem>
                        <SelectItem value="Mantenimiento">En Mantenimiento</SelectItem>
                        <SelectItem value="Vencido">Vencido / Fuera Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="size" className="text-[10px] font-black uppercase text-slate-500">Capacidad / Dimensión</Label>
                    <Input id="size" name="size" defaultValue={editingItem?.size} required placeholder="Ej. 10 lbs / 50 m2" className="h-10 text-xs font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location" className="text-[10px] font-black uppercase text-slate-500">Ubicación / Sede</Label>
                    <Input id="location" name="location" defaultValue={editingItem?.location} required placeholder="Planta / Cliente" className="h-10 text-xs font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lastService" className="text-[10px] font-black uppercase text-slate-500">Fecha Servicio</Label>
                    <Input id="lastService" name="lastService" type="date" defaultValue={editingItem?.lastService} required className="h-10 text-xs font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nextDue" className="text-[10px] font-black uppercase text-slate-500">Próximo Vto.</Label>
                    <Input id="nextDue" name="nextDue" type="date" defaultValue={editingItem?.nextDue} required className="h-10 text-xs font-bold" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-[#1c1c1c] text-white font-black uppercase text-xs h-11 border-b-4 border-primary">
                  {editingItem ? "Actualizar Registro" : "Confirmar Alta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-status-success/5 border-status-success/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-status-success uppercase font-black tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> Activos Operativos
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-status-success">{stats.operativos}</div>
          </CardContent>
        </Card>
        <Card className="bg-status-warning/5 border-status-warning/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-status-warning uppercase font-black tracking-widest flex items-center gap-2">
              <RefreshCw className="h-3 w-3" /> En Revisión / Recarga
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-status-warning">{stats.mantenimiento}</div>
          </CardContent>
        </Card>
        <Card className="bg-status-error/5 border-status-error/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-status-error uppercase font-black tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> Vencidos / Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-status-error">{stats.vencidos}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardHeader className="py-3">
            <CardTitle className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-2">
              <Package className="h-3 w-3" /> Total Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-black text-primary">{inventory?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código, ubicación o tipo..." 
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
                  <TableHead className="text-white font-black uppercase text-[10px]">Identificador</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Categoría</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Producto / Servicio</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Sede / Área</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Próx. Vto.</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="text-white w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.filter(i => 
                  i.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.category?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                    <TableCell className="font-black text-primary uppercase tracking-tight">{item.serialNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50">
                        {item.category === 'Fumigación' && <Bug className="mr-1 h-2.5 w-2.5 text-accent" />}
                        {item.category === 'Recarga' && <RefreshCw className="mr-1 h-2.5 w-2.5 text-blue-500" />}
                        {item.category === 'Venta' && <ShoppingCart className="mr-1 h-2.5 w-2.5 text-green-600" />}
                        {item.category === 'Mantenimiento' && <Tool className="mr-1 h-2.5 w-2.5 text-orange-500" />}
                        {item.category || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1c1c1c] text-[11px] uppercase">{item.type}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{item.size}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-slate-600 uppercase">{item.location}</TableCell>
                    <TableCell className="text-[11px] font-black text-primary">{item.nextDue}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5",
                        item.status === "Operativo" && "border-status-success text-status-success bg-status-success/5",
                        item.status === "Vencido" && "border-status-error text-status-error bg-status-error/5 animate-pulse",
                        item.status === "Mantenimiento" && "border-status-warning text-status-warning bg-status-warning/5",
                      )}>
                        {item.status}
                      </Badge>
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
                {inventory?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Package className="h-12 w-12" />
                        <p className="text-[11px] font-black uppercase tracking-widest">No hay registros cargados en el sistema</p>
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

import { CheckCircle2, AlertTriangle } from "lucide-react"
