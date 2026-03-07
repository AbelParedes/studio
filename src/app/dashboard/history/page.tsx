
"use client"

import { useState, useEffect } from "react"
import { serviceHistorySummary } from "@/ai/flows/service-history-summary-flow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History, FileText, Search, Sparkles, Loader2, User, ChevronRight, Clock, UserCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function HistoryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  // 1. Obtener perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Cargar Clientes de la Empresa
  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  // 3. Cargar Historial de Citas (Appointments) para el cliente seleccionado
  const appointmentsRef = useMemoFirebase(() => {
    if (!companyId || !selectedClientId) return null
    return query(
      collection(db, "appointments"), 
      where("companyId", "==", companyId),
      where("clientId", "==", selectedClientId)
    )
  }, [db, companyId, selectedClientId])
  
  const { data: appointments, isLoading: loadingHistory } = useCollection(appointmentsRef)

  // Ordenar citas por fecha descendente manualmente si no hay índice compuesto
  const sortedAppointments = [...(appointments || [])].sort((a, b) => {
    const dateA = a.date || ""
    const dateB = b.date || ""
    return dateB.localeCompare(dateA)
  })

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGenerateSummary = async () => {
    if (!selectedClientId || !sortedAppointments || sortedAppointments.length === 0) return

    setIsSummarizing(true)
    try {
      const client = clients?.find(c => c.id === selectedClientId)
      const historyText = sortedAppointments
        .map(a => `${a.date}: ${a.serviceType} (${a.status}) - Notas: ${a.notes || 'Sin observaciones'}`)
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

  // Limpiar resumen al cambiar de cliente
  useEffect(() => {
    setAiSummary(null)
  }, [selectedClientId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Historial Operativo</h2>
          <p className="text-muted-foreground text-sm">Registro cronológico de servicios por cliente y organización.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Selección de Cliente */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                <User className="h-3 w-3 mr-1" />
                Clientes de Mi Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar cliente..." 
                  className="pl-8 h-8 text-[11px]" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingClients ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  filteredClients?.map(client => (
                    <div 
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-md text-[11px] font-bold uppercase cursor-pointer transition-all border",
                        selectedClientId === client.id 
                          ? "bg-primary text-white border-primary shadow-sm" 
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
            <Card className="shadow-sm border-none bg-white border-t-2 border-t-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-primary flex items-center">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-accent animate-pulse" />
                  Asistente IA
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
                    disabled={isSummarizing || !sortedAppointments || sortedAppointments.length === 0}
                  >
                    {isSummarizing ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Analizando...</>
                    ) : (
                      <><Sparkles className="mr-2 h-3 w-3" /> Resumir Historial</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabla de Historial */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-sm font-bold uppercase flex items-center tracking-wider">
                <History className="mr-2 h-4 w-4 text-primary" />
                Registros de Servicio
              </CardTitle>
              {selectedClientId && (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase px-3">
                  {clients?.find(c => c.id === selectedClientId)?.name}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedClientId ? (
                <div className="flex flex-col items-center justify-center p-24 text-muted-foreground text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 opacity-20">
                    <User className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-tight">Seleccione un cliente para ver su historial exclusivo.</p>
                </div>
              ) : loadingHistory ? (
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table className="dense-table">
                  <TableHeader className="bg-primary">
                    <TableRow>
                      <TableHead className="text-white">Fecha / Hora</TableHead>
                      <TableHead className="text-white">Servicio</TableHead>
                      <TableHead className="text-white">Técnico</TableHead>
                      <TableHead className="text-white">Estado</TableHead>
                      <TableHead className="text-white">Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAppointments?.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold">
                          <div className="flex flex-col">
                            <span>{record.date}</span>
                            <span className="text-[9px] text-muted-foreground flex items-center">
                              <Clock className="h-2.5 w-2.5 mr-1" /> {record.time || "--:--"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">
                            {record.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-[11px]">
                            <UserCheck className="h-3 w-3 mr-1.5 text-muted-foreground" />
                            {record.technicianName || "Sin asignar"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-bold",
                            record.status === "Completado" 
                              ? "border-status-success text-status-success bg-status-success/5" 
                              : "text-muted-foreground"
                          )}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] max-w-[250px] truncate italic text-muted-foreground">
                          {record.notes || "Sin observaciones registradas."}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedAppointments?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                          No hay registros de servicio para este cliente en su empresa.
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
