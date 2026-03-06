
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Flame, Plus, Search, Loader2, Trash2, Edit2 } from "lucide-react"
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
    }

    if (editingItem) {
      updateDocumentNonBlocking(doc(db, "all_extinguishers", editingItem.id), equipmentData)
      toast({ title: "Equipo actualizado" })
    } else {
      const newEquip = { ...equipmentData, id: crypto.randomUUID() }
      addDocumentNonBlocking(collection(db, "all_extinguishers"), newEquip)
      toast({ title: "Equipo registrado" })
    }

    setIsAdding(false)
    setEditingItem(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "all_extinguishers", id))
    toast({ variant: "destructive", title: "Equipo removido" })
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
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Inventario de Equipos</h2>
          <p className="text-muted-foreground text-sm">Control exclusivo de extintores y activos de su organización.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Registrar Equipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveEquipment}>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Equipo" : "Registrar Nuevo Equipo"}</DialogTitle>
                <DialogDescription>Los detalles técnicos serán almacenados en el silo de datos de su empresa.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="serial">Número de Serie</Label>
                  <Input id="serial" name="serial" defaultValue={editingItem?.serialNumber} required placeholder="SN-XXXXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo de Agente</Label>
                    <Select name="type" required defaultValue={editingItem?.type || "PQS ABC"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PQS ABC">PQS ABC</SelectItem>
                        <SelectItem value="CO2">CO2</SelectItem>
                        <SelectItem value="K-Class">K-Class</SelectItem>
                        <SelectItem value="Agua">Agua Presurizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" required defaultValue={editingItem?.status || "Operativo"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operativo">Operativo</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="Vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="size">Capacidad</Label>
                    <Input id="size" name="size" defaultValue={editingItem?.size} required placeholder="Ej. 10 lbs" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" name="location" defaultValue={editingItem?.location} required placeholder="Pasillo principal" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lastService">Último Servicio</Label>
                    <Input id="lastService" name="lastService" type="date" defaultValue={editingItem?.lastService} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nextDue">Próximo Vto.</Label>
                    <Input id="nextDue" name="nextDue" type="date" defaultValue={editingItem?.nextDue} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">{editingItem ? "Actualizar" : "Registrar Equipo"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-status-success/5 border-status-success/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-success uppercase font-bold">Operativos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-success">{stats.operativos}</div>
          </CardContent>
        </Card>
        <Card className="bg-status-warning/5 border-status-warning/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-warning uppercase font-bold">Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-warning">{stats.mantenimiento}</div>
          </CardContent>
        </Card>
        <Card className="bg-status-error/5 border-status-error/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-error uppercase font-bold">Vencidos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-error">{stats.vencidos}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar en mi inventario..." 
              className="pl-9 h-8" 
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
                  <TableHead className="text-white">Serie</TableHead>
                  <TableHead className="text-white">Tipo</TableHead>
                  <TableHead className="text-white">Ubicación</TableHead>
                  <TableHead className="text-white">Vto.</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.filter(i => 
                  i.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  i.location?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.serialNumber}</TableCell>
                    <TableCell>{item.type} ({item.size})</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.nextDue}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold",
                        item.status === "Operativo" && "border-status-success text-status-success bg-status-success/5",
                        item.status === "Vencido" && "border-status-error text-status-error bg-status-error/5",
                        item.status === "Mantenimiento" && "border-status-warning text-status-warning bg-status-warning/5",
                      )}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {inventory?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No hay equipos registrados para su empresa.
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
