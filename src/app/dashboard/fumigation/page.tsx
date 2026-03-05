import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bug, Plus, Droplets, ShieldCheck, Thermometer } from "lucide-react"
import { cn } from "@/lib/utils"

const fumigationRecords = [
  { id: "FUM-2001", client: "Restaurante El Faro", type: "Control de Plagas General", areas: "Cocina, Salón principal", chemicals: "Deltametrina, Gel Cucarachas", date: "2024-02-15", nextDate: "2024-03-15", status: "Completado" },
  { id: "FUM-2002", client: "Bodega Logística", type: "Control de Roedores", areas: "Perímetro externo, Almacén A", chemicals: "Brodifacoum", date: "2024-02-10", nextDate: "2024-03-10", status: "En Proceso" },
  { id: "FUM-2003", client: "Residencial Arcos", type: "Termitas Preventivo", areas: "Cimentación, Jardines", chemicals: "Fipronil", date: "2024-01-20", nextDate: "2025-01-20", status: "Completado" },
  { id: "FUM-2004", client: "Plaza Central", type: "Desinfección COVID/Gripe", areas: "Pasillos comunes, Baños", chemicals: "Amonio Cuaternario", date: "2024-02-18", nextDate: "2024-02-25", status: "Programado" },
]

export default function FumigationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">CONTROL DE FUMIGACIÓN</h2>
          <p className="text-muted-foreground text-sm">Gestión de certificados, químicos y rutas de control de plagas.</p>
        </div>
        <Button className="bg-primary text-white h-9">
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden de Servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <Droplets className="h-3 w-3 mr-1 text-blue-500" />
              Químicos en Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">42 Lts</div>
            <p className="text-[10px] text-muted-foreground mt-1">Suficiente para 15 servicios estándar.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <ShieldCheck className="h-3 w-3 mr-1 text-status-success" />
              Certificados Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">128</div>
            <p className="text-[10px] text-muted-foreground mt-1">Emitidos este mes.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="py-4">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
              <Thermometer className="h-3 w-3 mr-1 text-accent" />
              Alertas de Plagas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold">5</div>
            <p className="text-[10px] text-status-error font-bold mt-1">Requieren atención inmediata.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase flex items-center">
            <Bug className="mr-2 h-4 w-4 text-primary" />
            Servicios de Fumigación Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="dense-table">
            <TableHeader className="bg-primary">
              <TableRow>
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Cliente</TableHead>
                <TableHead className="text-white">Tipo de Control</TableHead>
                <TableHead className="text-white">Áreas Tratadas</TableHead>
                <TableHead className="text-white">Químicos</TableHead>
                <TableHead className="text-white">Fecha</TableHead>
                <TableHead className="text-white">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fumigationRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-bold">{record.id}</TableCell>
                  <TableCell className="font-medium">{record.client}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell className="text-[11px] max-w-[150px] truncate">{record.areas}</TableCell>
                  <TableCell className="text-[11px] italic">{record.chemicals}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
