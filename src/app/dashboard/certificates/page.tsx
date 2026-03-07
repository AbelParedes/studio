
"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert,
  Building2,
  FileText,
  Clock,
  UserCheck,
  CheckSquare
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function CertificatesPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()

  const aptRef = useMemoFirebase(() => id ? doc(db, "appointments", id) : null, [db, id])
  const { data: apt, isLoading } = useDoc(aptRef)

  const companyRef = useMemoFirebase(() => 
    apt?.companyId ? doc(db, "companies", apt.companyId) : null,
  [db, apt?.companyId])
  const { data: company } = useDoc(companyRef)

  if (isLoading) return <div className="p-20 text-center font-bold uppercase">Cargando Certificado...</div>
  if (!apt) return <div className="p-20 text-center font-bold uppercase">Servicio no encontrado</div>

  const isFumigation = apt.serviceType === "Fumigación"
  const formattedDate = apt.date ? format(parseISO(apt.date), "PPP", { locale: es }) : "---"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[10px]">
          <ArrowLeft className="mr-2 h-3 w-3" /> Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-bold uppercase text-[10px]">
            <Printer className="mr-2 h-3 w-3" /> Imprimir
          </Button>
          <Button size="sm" className="bg-primary text-white font-bold uppercase text-[10px]">
            <Download className="mr-2 h-3 w-3" /> Guardar PDF
          </Button>
        </div>
      </div>

      <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col">
        {/* HEADER TÉCNICO */}
        <div className="p-12 pb-8 border-b-[6px] border-primary flex items-center justify-between bg-slate-50/50">
          <div className="relative h-24 w-64">
            {company?.logoUrl ? (
              <Image src={company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
            ) : (
              <div className="h-full w-full bg-slate-200 flex items-center justify-center rounded">
                <ShieldCheck className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter leading-none mb-2">
              CERTIFICADO TÉCNICO
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              CONSTANCIA DE OPERATIVIDAD Y SERVICIO
            </p>
            <div className="mt-4 bg-primary text-white px-6 py-2 rounded-lg font-black text-sm tracking-tight inline-block">
              ORDEN N° {apt.id.split('-')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* CUERPO DEL CERTIFICADO */}
        <div className="p-12 space-y-10 flex-1 relative">
          {/* MARCA DE AGUA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-45">
            <ShieldCheck className="h-[500px] w-[500px]" />
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase border-b-2 border-slate-100 pb-1">Datos de la Empresa Beneficiaria</h3>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-900 uppercase">{apt.clientName}</p>
                <p className="text-[11px] font-bold text-slate-500">UBICACIÓN: {apt.clientAddress || "---"}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">TIPO DE SERVICIO: {apt.serviceType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase border-b-2 border-slate-100 pb-1">Vigencia y Emisión</h3>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-700 uppercase">FECHA DE EJECUCIÓN: {formattedDate}</p>
                <p className="text-[11px] font-black text-status-success uppercase">PRÓXIMO VENCIMIENTO: {apt.nextDue || "PENDIENTE"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-[11px] font-black text-primary uppercase flex items-center gap-2 tracking-widest bg-slate-50 p-2 rounded">
              <CheckSquare className="h-4 w-4" /> ESPECIFICACIONES TÉCNICAS DEL SERVICIO
            </h3>
            
            {isFumigation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px]">
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 uppercase">Producto Utilizado:</p>
                  <p className="font-black text-slate-900 border-b pb-1">{apt.chemicalsUsed || "NO ESPECIFICADO"}</p>
                  <p className="font-bold text-slate-500 uppercase mt-4">Dosificación Aplicada:</p>
                  <p className="font-black text-slate-900 border-b pb-1">{apt.dosage || "SEGÚN FICHA TÉCNICA"}</p>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 uppercase">Plagas Controladas:</p>
                  <div className="flex flex-wrap gap-2">
                    {apt.pestTargeted?.map((p: string) => (
                      <Badge key={p} variant="outline" className="bg-slate-100 border-none font-bold uppercase text-[9px]">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px]">
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 uppercase">Inspección de Equipos:</p>
                  <ul className="space-y-2">
                    {Object.entries(apt.extChecklist || {}).map(([key, val]: [string, any]) => (
                      <li key={key} className="flex items-center justify-between border-b border-dashed pb-1">
                        <span className="uppercase font-bold text-slate-600">{key}:</span>
                        {val ? <Badge className="bg-status-success text-white text-[8px] h-4">CONFORME</Badge> : <Badge variant="outline" className="text-[8px] h-4">N/A</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 uppercase">Observaciones Finales:</p>
                  <p className="italic text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border">
                    {apt.observations || "Equipo operativo bajo estándares de seguridad vigentes."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-12 grid grid-cols-2 gap-24">
            <div className="text-center space-y-2">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center">
                <span className="text-[9px] uppercase font-bold text-slate-300">Sello y Firma Técnico Responsable</span>
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{apt.technicianName}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">REGISTRO TÉCNICO ESPECIALIZADO</p>
            </div>
            <div className="text-center space-y-2">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center">
                <span className="text-[9px] uppercase font-bold text-slate-300">Firma de Conformidad Cliente</span>
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{apt.clientSignatureName || "---"}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">RECEPTOR AUTORIZADO</p>
            </div>
          </div>
        </div>

        {/* FOOTER CORPORATIVO */}
        <div 
          className="mt-auto py-8 text-center text-white"
          style={{ backgroundColor: company?.primaryColor || '#1a2b3c' }}
        >
          <div className="px-12 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              {company?.name || "SERVIFUMIGA PRO PERÚ"}
            </p>
            <p className="text-[9px] font-bold opacity-70 uppercase">
              {company?.address} • {company?.phone} • {company?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
