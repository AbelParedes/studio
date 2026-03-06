
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bug, Plus, Droplets, ShieldCheck, Thermometer, Search, Loader2, Trash2, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, doc } from "firebase/firestore"
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

export default function FumigationPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)

  const fumigationRef = useMemoFirebase(() => collection(db, "fumigation_services"), [db])
  const { data: records, isLoading } = useCollection(fumigationRef)

  const handleSaveService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const serviceData = {
      clientName: formData.get("client") as string,
      type: formData.get("type") as string,
      areas: formData.get("areas") as string,
      chemicals: formData.get("chemicals") as string,
      date: formData.get("date") as string,
      status: formData.get("status") as string || "Programado",
    }

    if (editingService) {
      updateDocumentNonBlocking(doc(db, "fumigation_services", editingService.id), serviceData)
      toast({ title: "Servicio actualizado" })
    } else {
      const newService = { ...serviceData, id: crypto.randomUUID() }
      addDocumentNonBlocking(fumigationRef, newService)
      toast({ title: "Servicio registrado" })
    }

    setIsAdding(false)
    setEditingService(null)
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "fumigation_services", id))
    toast({ variant: "destructive", title: "Servicio eliminado" })
  }

  const openEdit = (record: any) => {
    setEditingService(record)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">CONTROL DE FUMIGACIÓN</h2>
          <p className="text-muted-foreground text-sm">Gestión de certificados y rutas de control de plagas.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingService(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveService}>
              <DialogHeader>
                <DialogTitle>{editingService ? "Editar Orden" : "Nueva Orden de Servicio"}</DialogTitle>
                <DialogDescription>Complete los detalles del servicio de fumigación.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Nombre del Cliente</Label>
                  <Input id="client" name="client" defaultValue={editingService?.clientName} required placeholder="Ej. Restaurante El Faro" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Control</Label>
                  <Input id="type" name="type" defaultValue={editingService?.type} required placeholder="Ej. Control de Roedores" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" name="date" type="date" defaultValue={editingService?.date} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" required defaultValue={editingService?.status || "Programado"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programado">Programado</SelectItem>
                        <SelectItem value="En Proceso">En Proceso</SelectItem>
                        <SelectItem value="Completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="areas">Áreas Tratadas</Label>
                  <Input id="areas" name="areas" defaultValue={editingService?.areas} placeholder="Ej. Cocina, Salón" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="chemicals">Químicos Utilizados</Label>
                  <Input id="chemicals" name="chemicals" defaultValue={editingService?.chemicals} placeholder="Ej. Deltametrina" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingService ? "Actualizar" : "Registrar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <Droplets className="h-3 w-3 mr-1 text-blue-500" />
              Certificados Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{records?.filter(r => r.status === "Completado").length || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-status-success" />
              Programados
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{records?.filter(r => r.status === "Programado").length || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <Thermometer className="h-3 w-3 mr-1 text-accent" />
              En Proceso
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">{records?.filter(r => r.status === "En Proceso").length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar servicio..." 
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
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white">Control</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records?.filter(r => 
                  r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.type?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-bold">{record.clientName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{record.type}</div>
                      <div className="text-[10px] text-muted-foreground italic">{record.chemicals}</div>
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold",
                        record.status === "Completado" && "border-status-success text-status-success bg-status-success/5",
                        record.status === "En Proceso" && "border-status-warning text-status-warning bg-status-warning/5",
                        record.status === "Programado" && "text-muted-foreground",
                      )}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(record)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(record.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
