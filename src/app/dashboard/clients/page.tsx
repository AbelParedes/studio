
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Loader2, Building2, User, FileText, MessageSquare, UserPlus, Users } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function ClientsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [clientType, setClientType] = useState<"Empresa" | "Persona">("Empresa")

  // Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // Filtrar clientes por empresa
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading } = useCollection(clientsRef)

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const clientData = {
      companyId: companyId,
      clientType: clientType,
      taxId: formData.get("taxId") as string,
      name: formData.get("name") as string,
      legalName: formData.get("legalName") as string,
      industry: formData.get("industry") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      contactPerson: {
        name: formData.get("contactName") as string,
        position: formData.get("contactPosition") as string,
        phone: formData.get("contactPhone") as string,
      },
      notes: formData.get("notes") as string,
    }

    if (editingClient) {
      updateDocumentNonBlocking(doc(db, "clients", editingClient.id), clientData)
      toast({ title: "Cliente actualizado" })
    } else {
      const newClient = { ...clientData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "clients"), newClient)
      toast({ title: "Cliente registrado" })
    }

    setIsAdding(false)
    setEditingClient(null)
  }

  const handleDeleteClient = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "clients", id))
    toast({ variant: "destructive", title: "Cliente eliminado" })
  }

  const openEdit = (client: any) => {
    setEditingClient(client)
    setClientType(client.clientType)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Clientes</h2>
          <p className="text-muted-foreground text-sm">Gestione la base de datos exclusiva de su empresa.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingClient(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveClient}>
              <DialogHeader>
                <DialogTitle>{editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
                <DialogDescription>Los datos serán visibles solo para los colaboradores de su empresa.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientType">Tipo de Cliente</Label>
                    <Select value={clientType} onValueChange={(val: any) => setClientType(val)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Empresa">Empresa </SelectItem>
                        <SelectItem value="Persona">Persona Natural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">{clientType === "Empresa" ? "RUC" : "DNI"}</Label>
                    <Input id="taxId" name="taxId" defaultValue={editingClient?.taxId} required placeholder="Identificación fiscal" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input id="name" name="name" defaultValue={editingClient?.name} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="legalName">Razón Social</Label>
                    <Input id="legalName" name="legalName" defaultValue={editingClient?.legalName} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Giro del Negocio</Label>
                    <Input id="industry" name="industry" defaultValue={editingClient?.industry} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={editingClient?.phone} required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Principal</Label>
                  <Input id="email" name="email" defaultValue={editingClient?.email} type="email" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" defaultValue={editingClient?.address} required />
                </div>

                <Separator />
                <div className="text-primary font-bold text-xs uppercase">Persona de Contacto</div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contactName">Nombre</Label>
                    <Input id="contactName" name="contactName" defaultValue={editingClient?.contactPerson?.name} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPosition">Cargo</Label>
                    <Input id="contactPosition" name="contactPosition" defaultValue={editingClient?.contactPerson?.position} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">Celular</Label>
                    <Input id="contactPhone" name="contactPhone" defaultValue={editingClient?.contactPerson?.phone} />
                  </div>
                </div>

                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">Nota</Label>
                  <Textarea id="notes" name="notes" defaultValue={editingClient?.notes} className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">{editingClient ? "Actualizar" : "Crear Expediente"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar clientes de mi empresa..." 
              className="pl-9 h-9" 
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
                  <TableHead className="text-white">Identidad</TableHead>
                  <TableHead className="text-white">Nombre / Empresa</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Dirección</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold w-fit">
                          {client.clientType}
                        </Badge>
                        <span className="font-mono text-[10px]">{client.taxId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{client.name}</span>
                        <span className="text-[10px] text-muted-foreground">{client.industry}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px]">
                        <span className="font-bold">{client.contactPerson?.name}</span>
                        <span className="text-muted-foreground">{client.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[11px] text-muted-foreground max-w-[200px] truncate">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        {client.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No hay clientes registrados en su empresa.
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
