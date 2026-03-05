
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreVertical, MapPin, Phone, Mail } from "lucide-react"

const clients = [
  { id: "CL-001", name: "Almacenes Exito", contact: "Juan Perez", phone: "555-0123", email: "juan@exito.com", locations: 3, lastService: "2023-11-15" },
  { id: "CL-002", name: "Restaurantes Italianos S.A.", contact: "Maria Rossi", phone: "555-4567", email: "maria@rossi.it", locations: 1, lastService: "2024-01-20" },
  { id: "CL-003", name: "Hospital Metropolitano", contact: "Dr. Gomez", phone: "555-8899", email: "soporte@hospital.com", locations: 12, lastService: "2023-12-05" },
  { id: "CL-004", name: "Condominio Las Brisas", contact: "Admin Roberto", phone: "555-3321", email: "admin@brisas.com", locations: 1, lastService: "2024-02-10" },
]

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">CLIENTES</h2>
          <p className="text-muted-foreground text-sm">Administre su cartera de clientes y puntos de servicio.</p>
        </div>
        <Button className="bg-primary text-white h-9">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filtrar por nombre, contacto o ID..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">Filtrar</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="dense-table">
            <TableHeader className="bg-primary hover:bg-primary">
              <TableRow>
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Nombre Empresa</TableHead>
                <TableHead className="text-white">Contacto Principal</TableHead>
                <TableHead className="text-white">Información de Contacto</TableHead>
                <TableHead className="text-white">Sedes</TableHead>
                <TableHead className="text-white">Último Servicio</TableHead>
                <TableHead className="text-white w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-bold">{client.id}</TableCell>
                  <TableCell className="font-semibold">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
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
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-accent" />
                      {client.locations} Sedes
                    </div>
                  </TableCell>
                  <TableCell>{client.lastService}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
