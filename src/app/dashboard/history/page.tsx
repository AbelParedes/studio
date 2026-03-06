"use client"

import { useState, useEffect } from "react"
import { serviceHistorySummary } from "@/ai/flows/service-history-summary-flow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History, FileText, Search, Sparkles, Loader2, User, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  // Fetch Clients
  const clientsRef = useMemoFirebase(() => collection(db, "clients"), [db])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  // Fetch Service History for Selected Client
  const appointmentsRef = useMemoFirebase(() => {
    if (!selectedClientId) return null
    return collection(db, "clients", selectedClientId, "serviceAppointments")
  }, [db, selectedClientId])
  
  const { data: appointments, isLoading: loadingHistory } = useCollection(appointmentsRef)

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGenerateSummary = async () => {
    if (!selectedClientId || !appointments || appointments.length === 0) return

    setIsSummarizing(true)
    try {
      const client = clients?.find(c => c.id === selectedClientId)
      const historyText = appointments
        .map(a => `${a.scheduledDateTime}: ${a.status} - ${a.notes || 'Sin notas'}`)
        .join("\n")

      const { summary } = await serviceHistorySummary({
        clientName: client?.name || "Cliente",
        serviceHistory: historyText
      })
      setAiSummary(summary)
    } catch (error) {
      console.error("AI Summary failed", error)
    } finally {
      setIsSummarizing(false)
    }
  }

  // Clear summary when client changes
  useEffect(() => {
    setAiSummary(null)
  }, [selectedClientId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">HISTORIAL DE SERVICIOS</h2>
          <p className="text-muted-foreground text-sm">Registro cronológico completo por cliente y equipo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                <User className="h-3 w-3 mr-1" />
                Seleccionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-8 h-8 text-xs" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                {loadingClients ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  filteredClients?.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md text-[11px] font-medium cursor-pointer transition-colors border",
                        selectedClientId === client.id 
                          ? "bg-primary text-white border-primary" 
                          : "hover:bg-muted border-transparent"
                      )}
                    >
                      <span className="truncate pr-2">{client.name}</span>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </div>
                  ))
                )}
                {!loadingClients && filteredClients?.length === 0 && (
                  <p className="text-[10px] text-center text-muted-foreground py-4">No se encontraron clientes.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedClientId && (
            <Card className="shadow-sm border-none bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                  <Sparkles className="h-3 w-3 mr-1 text-accent" />
                  Análisis de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiSummary ? (
                  <div className="text-[11px] leading-relaxed text-[#333] p-3 bg-accent/5 rounded border border-dashed border-accent/30 italic">
                    {aiSummary}
                  </div>
                ) : (
                  <Button 
                    className="w-full text-[10px] h-8 font-bold uppercase" 
                    variant="outline"
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing || !appointments || appointments.length === 0}
                  >
                    {isSummarizing ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Analizando...</>
                    ) : (
                      <><Sparkles className="mr-2 h-3 w-3" /> Generar Resumen</>
                    )}
                  </Button>
                )}
                {appointments?.length === 0 && !loadingHistory && (
                  <p className="text-[10px] text-center text-muted-foreground">Sin historial para resumir.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Table */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase flex items-center">
                <History className="mr-2 h-4 w-4 text-primary" />
                Registros Históricos
              </CardTitle>
              {selectedClientId && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {clients?.find(c => c.id === selectedClientId)?.name}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedClientId ? (
                <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                  <User className="h-10 w-10 mb-4 opacity-20" />
                  <p className="text-sm">Seleccione un cliente para ver su historial completo.</p>
                </div>
              ) : loadingHistory ? (
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table className="dense-table">
                  <TableHeader className="bg-primary">
                    <TableRow>
                      <TableHead className="text-white">Fecha</TableHead>
                      <TableHead className="text-white">Estado</TableHead>
                      <TableHead className="text-white">Notas / Detalles</TableHead>
                      <TableHead className="text-white text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-bold">
                          {new Date(record.scheduledDateTime).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-bold",
                            record.status === "Completed" ? "border-status-success text-status-success bg-status-success/5" : "text-muted-foreground"
                          )}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] max-w-[300px] truncate">
                          {record.notes || "Sin observaciones registradas."}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {appointments?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          No hay registros de servicio para este cliente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
