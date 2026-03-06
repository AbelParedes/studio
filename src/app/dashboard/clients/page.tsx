"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Loader2, Building2, User, FileText, Briefcase, Users, MessageSquare, UserPlus } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
      address: formData.get("address") as string,
      contactPerson: {
        name: formData.get("contactName") as string,
        position: formData.get("contactPosition") as string,
        phone: formData.get("contactPhone") as string,
      },
      notes: formData.get("notes") as string,
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
          <p className="text-muted-foreground text-sm">Base de datos centralizada para servicios técnicos y comerciales.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Expediente</DialogTitle>
                <DialogDescription>Complete los datos del cliente para la gestión de servicios e inspecciones.</DialogDescription>
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
                    <Label htmlFor="taxId">{clientType === "Empresa" ? "RUC" : "DNI"}</Label>
                    <Input id="taxId" name="taxId" required placeholder={clientType === "Empresa" ? "Ej. 20123456789" : "Ej. 12345678"} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Comercial / Nombre Completo</Label>
                    <Input id="name" name="name" required placeholder="Ej. Restaurante El Faro" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="legalName">Razón Social (Opcional)</Label>
                    <Input id="legalName" name="legalName" placeholder="Ej. El Faro S.A.C." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Giro del Negocio</Label>
                    <Input id="industry" name="industry" placeholder="Ej. Alimentación, Almacén" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono Principal</Label>
                    <Input id="phone" name="phone" required placeholder="+51 987..." />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico Principal</Label>
                  <Input id="email" name="email" type="email" required placeholder="correo@cliente.com" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección Completa</Label>
                  <Input id="address" name="address" required placeholder="Av. Los Pinos 123, Of. 402, Lima" />
                </div>

                <Separator />
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                  <UserPlus className="h-3 w-3" /> Persona de Contacto
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contactName">Nombre de Contacto</Label>
                    <Input id="contactName" name="contactName" placeholder="Ej. Juan Pérez" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPosition">Cargo</Label>
                    <Input id="contactPosition" name="contactPosition" placeholder="Ej. Administrador" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">Celular Contacto</Label>
                    <Input id="contactPhone" name="contactPhone" placeholder="Ej. 999 888 777" />
                  </div>
                </div>

                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Notas Técnicas / Observaciones
                  </Label>
                  <Textarea id="notes" name="notes" placeholder="Detalles sobre acceso, horarios de fumigación, cantidad de extintores estimados..." className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Crear Expediente de Cliente</Button>
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
                placeholder="Buscar por identificación, nombre o email..." 
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
                  <TableHead className="text-white">Identidad</TableHead>
                  <TableHead className="text-white">Cliente / Razón Social</TableHead>
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
                        <div className="flex items-center gap-1.5">
                          {client.clientType === "Empresa" ? (
                            <Building2 className="h-3 w-3 text-primary" />
                          ) : (
                            <User className="h-3 w-3 text-accent" />
                          )}
                          <span className="font-bold text-[10px] uppercase text-muted-foreground">{client.clientType}</span>
                        </div>
                        <div className="flex items-center text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                          <FileText className="h-2.5 w-2.5 mr-1 text-primary" />
                          <span className="font-bold">{client.clientType === "Empresa" ? "RUC: " : "DNI: "}</span>
                          {client.taxId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{client.name}</span>
                        <span className="text-[10px] text-muted-foreground italic">{client.legalName || "-"}</span>
                        {client.industry && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-[8px] uppercase font-bold border-accent/20 text-accent h-4">
                              {client.industry}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center text-[11px] font-bold text-[#444]">
                          <UserCircle2 className="h-3 w-3 mr-1 text-primary" /> {client.contactPerson?.name || "No asignado"}
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Phone className="h-2.5 w-2.5 mr-1" /> {client.phone}
                        </div>
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Mail className="h-2.5 w-2.5 mr-1" /> {client.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[11px] text-muted-foreground max-w-[200px] leading-tight">
                        <MapPin className="h-3 w-3 mr-1 text-accent shrink-0" />
                        {client.address}
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
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 opacity-10" />
                        <p className="text-sm font-medium uppercase tracking-widest">No hay clientes registrados</p>
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

function UserCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
