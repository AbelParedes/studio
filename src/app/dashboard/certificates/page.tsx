
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileCheck, 
  Search, 
  Printer, 
  Download, 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isAfter, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function CertificatesRegistryPage() {
  const db = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // 1. Perfil para companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  // 2. Obtener citas completadas (que son las que tienen certificado)
  const certificatesQuery = useMemoFirebase(() => 
    companyId ? query(
      collection(db, "appointments"), 
      where("companyId", "==", companyId),
      where("status", "==", "Completado")
    ) : null,
  [db, companyId])
  const { data: certificates, isLoading } = useCollection(certificatesQuery)

  const filteredCerts = certificates?.filter(c => 
    c.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.finishedAt || "").localeCompare(a.finishedAt || ""))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Archivo de Protocolos Técnicos</h2>
          <p className="text-muted-foreground text-sm font-medium uppercase text-[10px] tracking-widest">Repositorio central de certificados de operatividad y sanidad.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 text-[10px] font-bold uppercase">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filtrar Vigencia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Protocolos Vigentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-success">
              {certificates?.filter(c => !c.nextDue || isAfter(parseISO(c.nextDue), new Date())).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-status-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Vencimiento Próximo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-status-warning">
              {certificates?.filter(c => {
                if (!c.nextDue) return false
                const next = parseISO(c.nextDue)
                const thirtyDays = new Date()
                thirtyDays.setDate(thirtyDays.getDate() + 30)
                return isAfter(next, new Date()) && !isAfter(next, thirtyDays)
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Documentos Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {certificates?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente o N° Certificado..." 
              className="pl-9 h-10 text-xs font-bold uppercase" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px]">Folio / Protocolo</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Empresa Beneficiaria</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Tipo de Servicio</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Emisión</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Vencimiento</TableHead>
                  <TableHead className="text-white text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCerts?.map((cert) => {
                  const isExpired = cert.nextDue && !isAfter(parseISO(cert.nextDue), new Date())
                  return (
                    <TableRow key={cert.id} className="hover:bg-muted/30 border-slate-100 transition-colors">
                      <TableCell className="font-black text-primary uppercase">
                        <div className="flex flex-col">
                          <span>{cert.certificateNumber || `CERT-${cert.id.split('-')[0].toUpperCase()}`}</span>
                          <span className="text-[8px] opacity-50 font-mono">ORD: {cert.id.split('-')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold uppercase text-[11px]">{cert.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 bg-primary/5">
                          {cert.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-medium">
                        {cert.date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-black",
                            isExpired ? "text-status-error" : "text-status-success"
                          )}>
                            {cert.nextDue || "---"}
                          </span>
                          {isExpired && <AlertCircle className="h-3 w-3 text-status-error animate-pulse" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-primary" 
                            title="Ver Protocolo"
                            onClick={() => router.push(`/dashboard/certificates/view/${cert.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" title="Imprimir">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredCerts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <FileCheck className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase">No se han emitido protocolos aún</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary text-white shadow-xl border-none rounded-[2rem]">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-xl uppercase tracking-tight">Trazabilidad Industrial Asegurada</h3>
              <p className="text-sm opacity-80 font-medium max-w-xl">
                Cada certificado emitido queda vinculado permanentemente a la hoja de vida de los equipos del cliente, garantizando cumplimiento normativo total.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase text-accent bg-white px-6 py-2 rounded-full shadow-lg">
            Sistema de Certificación v5.2
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
