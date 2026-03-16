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

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading: loadingClients } = useCollection(clientsRef)

  const appointmentsRef = useMemoFirebase(() => {
    if (!companyId || !selectedClientId) return null
    return query(collection(db, "appointments"), where("companyId", "==", companyId), where("clientId", "==", selectedClientId))
  }, [db, companyId, selectedClientId])
  const { data: appointments, isLoading: loadingHistory } = useCollection(appointmentsRef)

  const sortedAppointments = [...(appointments || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""))

  const handleGenerateSummary = async () => {
    if (!selectedClientId || !sortedAppointments.length) return
    setIsSummarizing(true)
    try {
      const client = clients?.find(c => c.id === selectedClientId)
      const historyText = sortedAppointments.map(a => `${a.date}: ${a.serviceType} (${a.status})`).join("\n")
      const { summary } = await serviceHistorySummary({ clientName: client?.name || "Cliente", serviceHistory: historyText })
      setAiSummary(summary)
    } catch (e) { console.error(e) } finally { setIsSummarizing(false) }
  }

  useEffect(() => { setAiSummary(null) }, [selectedClientId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-primary">Historial de Clientes</h2>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Trazabilidad operativa por organización.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="p-4"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center"><User className="h-3 w-3 mr-2" /> Mi Cartera</CardTitle></CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Filtrar..." className="pl-8 h-8 text-[10px] font-bold uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <div className="space-y-1 max-h-[300px] sm:max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {clients?.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => setSelectedClientId(c.id)} className={cn("flex items-center justify-between p-2.5 rounded-md text-[10px] font-black uppercase cursor-pointer transition-all border", selectedClientId === c.id ? "bg-primary text-white border-primary shadow-md" : "hover:bg-muted border-transparent")}>
                    <span className="truncate pr-2">{c.name}</span><ChevronRight className="h-3 w-3 opacity-50" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedClientId && (
            <Card className="shadow-sm border-none bg-white border-t-4 border-t-accent overflow-hidden">
              <CardHeader className="p-4"><CardTitle className="text-[10px] font-black uppercase text-primary flex items-center"><Sparkles className="h-3.5 w-3.5 mr-2 text-accent" /> Asistente IA</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {aiSummary ? <div className="text-[10px] sm:text-[11px] leading-relaxed p-3 bg-accent/5 rounded border-2 border-dashed italic font-medium">{aiSummary}</div> : (
                  <Button className="w-full text-[9px] h-9 font-black uppercase shadow-lg" onClick={handleGenerateSummary} disabled={isSummarizing || !sortedAppointments.length}>
                    {isSummarizing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />} Resumir con IA
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4 sm:p-6 bg-white">
              <CardTitle className="text-xs sm:text-sm font-black uppercase flex items-center tracking-widest text-primary"><History className="mr-2 h-4 w-4" /> Bitácora Técnica</CardTitle>
              {selectedClientId && <Badge className="text-[8px] sm:text-[9px] font-black uppercase px-3">{clients?.find(c => c.id === selectedClientId)?.name}</Badge>}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto custom-scrollbar">
              {!selectedClientId ? (
                <div className="flex flex-col items-center justify-center p-20 text-muted-foreground opacity-40">
                  <User className="h-12 w-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Seleccione un cliente para ver su historial</p>
                </div>
              ) : (
                <Table className="dense-table min-w-[600px] lg:min-w-full">
                  <TableHeader className="bg-primary">
                    <TableRow><TableHead className="text-white">Fecha</TableHead><TableHead className="text-white">Servicio</TableHead><TableHead className="text-white">Técnico</TableHead><TableHead className="text-white">Estado</TableHead><TableHead className="text-white">Notas</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAppointments.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold"><div className="flex flex-col"><span>{record.date}</span><span className="text-[8px] text-muted-foreground font-medium">{record.time || "--:--"}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase">{record.serviceType}</Badge></TableCell>
                        <TableCell className="text-[10px] font-bold uppercase"><div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> {record.technicianName || "Sin asignar"}</div></TableCell>
                        <TableCell><Badge variant="outline" className={cn("text-[8px] font-black uppercase", record.status === "Completado" ? "text-status-success border-status-success/20 bg-status-success/5" : "text-slate-400")}>{record.status}</Badge></TableCell>
                        <TableCell className="text-[10px] max-w-[200px] truncate italic font-medium opacity-70">{record.notes || "Sin observaciones"}</TableCell>
                      </TableRow>
                    ))}
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