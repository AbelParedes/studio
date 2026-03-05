import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Flame, Plus, Download, Filter, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

const inventory = [
  { id: "EQ-1001", client: "Plaza Central", type: "PQS ABC", size: "10 lbs", location: "Entrada Principal", lastService: "2023-05-10", nextDue: "2024-05-10", status: "Operativo" },
  { id: "EQ-1002", client: "Plaza Central", type: "CO2", size: "5 lbs", location: "Cuarto Eléctrico", lastService: "2023-06-15", nextDue: "2024-06-15", status: "Operativo" },
  { id: "EQ-1003", client: "Bodega Logística", type: "PQS ABC", size: "20 lbs", location: "Andén 4", lastService: "2023-03-01", nextDue: "2024-03-01", status: "Vencido" },
  { id: "EQ-1004", client: "Restaurante El Faro", type: "K-Class", size: "6 lts", location: "Cocina", lastService: "2023-08-20", nextDue: "2024-08-20", status: "Mantenimiento" },
  { id: "EQ-1005", client: "Hospital Metropolitano", type: "Agua Presurizada", size: "2.5 gl", location: "Pasillo B", lastService: "2023-10-01", nextDue: "2024-10-01", status: "Operativo" },
]

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">INVENTARIO DE EXTINTORES</h2>
          <p className="text-muted-foreground text-sm">Seguimiento detallado de equipos contra incendio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button className="bg-primary text-white h-9">
            <Plus className="mr-2 h-4 w-4" /> Registrar Equipo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-status-success/5 border-status-success/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-success uppercase">Equipos Operativos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-success">1,142</div>
          </CardContent>
        </Card>
        <Card className="bg-status-warning/5 border-status-warning/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-warning uppercase">En Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-warning">48</div>
          </CardContent>
        </Card>
        <Card className="bg-status-error/5 border-status-error/20">
          <CardHeader className="py-3">
            <CardTitle className="text-xs text-status-error uppercase">Vencidos / Fuera de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-status-error">12</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-3 w-3" /> Filtrar
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Tag className="mr-2 h-3 w-3" /> Categorías
            </Button>
          </div>
          <div className="text-xs text-muted-foreground uppercase font-bold">
            Total Equipos: {inventory.length}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="dense-table">
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="text-white">ID Equipo</TableHead>
                <TableHead className="text-white">Cliente</TableHead>
                <TableHead className="text-white">Tipo / Capacidad</TableHead>
                <TableHead className="text-white">Ubicación</TableHead>
                <TableHead className="text-white">Último Manto.</TableHead>
                <TableHead className="text-white">Próximo Vto.</TableHead>
                <TableHead className="text-white">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.id}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.type}</div>
                    <div className="text-[10px] text-muted-foreground">{item.size}</div>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>{item.lastService}</TableCell>
                  <TableCell className={cn(item.status === "Vencido" && "text-status-error font-bold")}>
                    {item.nextDue}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px] px-2 py-0 uppercase font-bold",
                      item.status === "Operativo" && "border-status-success text-status-success bg-status-success/5",
                      item.status === "Vencido" && "border-status-error text-status-error bg-status-error/5",
                      item.status === "Mantenimiento" && "border-status-warning text-status-warning bg-status-warning/5",
                    )}>
                      {item.status}
                    </Badge>
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
