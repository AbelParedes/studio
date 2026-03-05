
import { serviceHistorySummary } from "@/ai/flows/service-history-summary-flow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History, FileText, Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function HistoryPage() {
  // Simulated service data for the AI flow
  const mockHistoryData = `
    2023-01-10: Fumigación preventiva total en restaurante. Aplicación de gel contra cucarachas.
    2023-04-12: Mantenimiento de 12 extintores PQS. 2 requirieron cambio de vávula.
    2023-07-15: Control de roedores. Instalación de 5 estaciones de cebado perimetral.
    2023-10-20: Refuerzo de fumigación en área de almacén seco. Se detectó presencia de hormiga carpintera.
  `

  const { summary } = await serviceHistorySummary({
    clientName: "Restaurante El Faro",
    serviceHistory: mockHistoryData
  })

  const records = [
    { id: "R-998", date: "2023-10-20", type: "Fumigación", description: "Control Hormiga Carpintera", technician: "Carlos Ruiz", cost: "$85.00" },
    { id: "R-985", date: "2023-07-15", type: "Pest Control", description: "Estaciones Roedores", technician: "M. Soto", cost: "$120.00" },
    { id: "R-950", date: "2023-04-12", type: "Extintores", description: "Mantenimiento Preventivo", technician: "A. Perez", cost: "$145.00" },
    { id: "R-900", date: "2023-01-10", type: "Fumigación", description: "Preventiva General", technician: "Carlos Ruiz", cost: "$75.00" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">HISTORIAL DE SERVICIOS</h2>
          <p className="text-muted-foreground text-sm">Registro cronológico completo por cliente y equipo.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar en el historial..." className="pl-9 h-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-accent" />
                Resumen de IA (Vista Rápida)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[12px] leading-relaxed text-[#333] p-3 bg-background rounded border border-dashed border-accent/30 italic">
                {summary}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                Analizado a partir de los últimos 4 servicios.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Filtros Rápidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-start py-1.5 text-[11px] cursor-pointer hover:bg-muted">Extintores (145)</Badge>
              <Badge variant="outline" className="w-full justify-start py-1.5 text-[11px] cursor-pointer hover:bg-muted">Fumigación (84)</Badge>
              <Badge variant="outline" className="w-full justify-start py-1.5 text-[11px] cursor-pointer hover:bg-muted">Inspecciones (12)</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase flex items-center">
                <History className="mr-2 h-4 w-4 text-primary" />
                Registros Históricos
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">Restaurante El Faro</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="dense-table">
                <TableHeader className="bg-primary">
                  <TableRow>
                    <TableHead className="text-white">ID</TableHead>
                    <TableHead className="text-white">Fecha</TableHead>
                    <TableHead className="text-white">Tipo Servicio</TableHead>
                    <TableHead className="text-white">Descripción</TableHead>
                    <TableHead className="text-white">Técnico</TableHead>
                    <TableHead className="text-white text-right">Monto</TableHead>
                    <TableHead className="text-white w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-bold">{record.id}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase">{record.type}</Badge>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.technician}</TableCell>
                      <TableCell className="text-right font-medium">{record.cost}</TableCell>
                      <TableCell>
                        <FileText className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
