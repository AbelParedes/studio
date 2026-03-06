
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Loader2, Building2, User, FileText, Briefcase } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ClientsPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [clientType, setClientType] = useState<"Empresa" | "Persona">("Empresa")
  
  // Data Fetching
  const clientsRef = useMemoFirebase(() => collection(db, "clients"), [db])
  const { data: clients, isLoading } = useCollection(clientsRef)

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newClient = {
      clientType: clientType,
      taxId: formData.get("taxId") as string,
      name: formData.get("name") as string,
      legalName: formData.get("legalName") as string,
      industry: formData.get("industry") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      billingAddressLine1: formData.get("address") as string,
      billingCity: formData.get("city") as string,
      billingState: formData.get("state") as string,
      billingZipCode: formData.get("zip") as string,
      billingCountry: "México",
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }

    addDocumentNonBlocking(clientsRef, newClient)
    setIsAdding(false)
    toast({ title: "Cliente registrado", description: `El cliente ${newClient.name} se ha añadido exitosamente.` })
  }

  const handleDeleteClient = (id: string) => {
    const docRef = doc(db, "clients", id)
    deleteDocumentNonBlocking(docRef)
    toast({ variant: "destructive", title: "Cliente eliminado" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">GESTIÓN DE CLIENTES</h2>
          <p className="text-muted-foreground text-sm">Ficha técnica completa para servicios de extintores y fumigación.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                <DialogDescription>Complete los datos fiscales y de contacto para el expediente técnico.</DialogDescription>
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
                        <SelectItem value="Empresa">Empresa / Moral</SelectItem>
                        <SelectItem value="Persona">Persona / Física</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">RUC / RFC (Identificación Fiscal)</Label>
                    <Input id="taxId" name="taxId" required placeholder="Ej. 20123456789" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input id="name" name="name" required placeholder="Ej. Restaurante El Faro" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="legalName">Razón Social</Label>
                    <Input id="legalName" name="legalName" placeholder="Ej. El Faro S.A.C." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Giro / Actividad Económica</Label>
                    <Input id="industry" name="industry" placeholder="Ej. Alimentación, Logística" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                    <Input id="phone" name="phone" required placeholder="Ej. +51 987 654 321" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico (Facturación/Reportes)</Label>
                  <Input id="email" name="email" type="email" required placeholder="administracion@cliente.com" />
                </div>

                <Separator />
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Dirección Fiscal / Principal</h4>

                <div className="grid gap-2">
                  <Label htmlFor="address">Calle, Número y Referencia</Label>
                  <Input id="address" name="address" required placeholder="Av. Principal 123, Of. 402" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ciudad / Distrito</Label>
                    <Input id="city" name="city" required placeholder="Ej. Miraflores" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">Estado / Provincia</Label>
                    <Input id="state" name="state" required placeholder="Ej. Lima" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zip">Código Postal</Label>
                    <Input id="zip" name="zip" placeholder="00000" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">Crear Expediente de Cliente</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por RUC, nombre o email..." 
                className="pl-9 h-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                  <TableHead className="text-white">Identidad Fiscal</TableHead>
                  <TableHead className="text-white">Nombre / Razón Social</TableHead>
                  <TableHead className="text-white">Giro</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Ubicación</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {client.clientType === "Empresa" ? (
                            <Building2 className="h-3 w-3 text-primary" />
                          ) : (
                            <User className="h-3 w-3 text-accent" />
                          )}
                          <span className="font-bold text-[10px] uppercase text-muted-foreground">{client.clientType}</span>
                        </div>
                        <div className="flex items-center text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                          <FileText className="h-2.5 w-2.5 mr-1 text-primary" />
                          {client.taxId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{client.name}</span>
                        <span className="text-[10px] text-muted-foreground italic">{client.legalName || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold border-accent/20 text-accent">
                        <Briefcase className="h-2.5 w-2.5 mr-1" />
                        {client.industry || "Sin Giro"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" /> {client.phone}
                        </div>
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" /> {client.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[11px] text-muted-foreground max-w-[150px] truncate">
                        <MapPin className="h-3 w-3 mr-1 text-accent shrink-0" />
                        {client.billingAddressLine1}, {client.billingCity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 opacity-10" />
                        <p className="text-sm">No se encontraron clientes registrados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-primary text-white border-none shadow-lg">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Base de Datos Centralizada</p>
              <p className="text-[11px] opacity-80">Todos los clientes registrados están vinculados automáticamente a los módulos de inventario y fumigación.</p>
            </div>
          </div>
          <Badge className="bg-white text-primary hover:bg-white/90">
            {clients?.length || 0} CLIENTES
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
