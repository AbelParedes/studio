"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreVertical, MapPin, Phone, Mail, Trash2, Edit2, Loader2 } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"

export default function ClientsPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  // Data Fetching
  const clientsRef = useMemoFirebase(() => collection(db, "clients"), [db])
  const { data: clients, isLoading } = useCollection(clientsRef)

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newClient = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      billingAddressLine1: formData.get("address") as string,
      billingCity: "Ciudad",
      billingState: "Estado",
      billingZipCode: "00000",
      billingCountry: "México",
      id: crypto.randomUUID()
    }

    addDocumentNonBlocking(clientsRef, newClient)
    setIsAdding(false)
    toast({ title: "Cliente registrado", description: "El cliente se ha añadido exitosamente." })
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
          <h2 className="text-2xl font-bold tracking-tight mb-1">CLIENTES</h2>
          <p className="text-muted-foreground text-sm">Administre su cartera de clientes y puntos de servicio.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                <DialogDescription>Ingrese los datos básicos para crear la ficha del cliente.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Comercial</Label>
                  <Input id="name" name="name" required placeholder="Ej. Almacenes Exito" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="contacto@cliente.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" required placeholder="555-0000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección Principal</Label>
                  <Input id="address" name="address" required placeholder="Calle 123 #45-67" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Guardar Cliente</Button>
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
                placeholder="Buscar por nombre o email..." 
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
              <TableHeader className="bg-primary hover:bg-primary">
                <TableRow>
                  <TableHead className="text-white">Nombre Empresa</TableHead>
                  <TableHead className="text-white">Información de Contacto</TableHead>
                  <TableHead className="text-white">Dirección</TableHead>
                  <TableHead className="text-white w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-semibold">{client.name}</TableCell>
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
                      <div className="flex items-center text-[11px]">
                        <MapPin className="h-3 w-3 mr-1 text-accent" />
                        {client.billingAddressLine1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No se encontraron clientes.
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
