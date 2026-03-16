
"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  CheckSquare,
  MapPin,
  Phone,
  Mail,
  Globe,
  QrCode,
  Award
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()

  const aptRef = useMemoFirebase(() => id ? doc(db, "appointments", id) : null, [db, id])
  const { data: apt, isLoading } = useDoc(aptRef)

  const companyRef = useMemoFirebase(() => 
    apt?.companyId ? doc(db, "companies", apt.companyId) : null,
  [db, apt?.companyId])
  const { data: company } = useDoc(companyRef)

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse">Generando Documento...</div>
  if (!apt) return <div className="p-20 text-center font-bold uppercase">Registro no encontrado</div>

  const isFumigation = apt.serviceType === "Fumigación"
  const formattedDate = apt.date ? format(parseISO(apt.date), "PPP", { locale: es }) : "---"
  const certNumber = `CERT-${apt.id.split('-')[0].toUpperCase()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[10px]">
          <ArrowLeft className="mr-2 h-3 w-3" /> Volver al Registro
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-bold uppercase text-[10px]">
            <Printer className="mr-2 h-3 w-3" /> Imprimir
          </Button>
          <Button size="sm" className="bg-primary text-white font-bold uppercase text-[10px]">
            <Download className="mr-2 h-3 w-3" /> Descargar Oficial
          </Button>
        </div>
      </div>

      {/* DOCUMENTO PROFESIONAL A4 */}
      <div className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-[#1c1c1c]">
        
        {/* SELLO DE SEGURIDAD FLOTANTE (Impresión) */}
        <div className="absolute top-48 right-12 opacity-20 rotate-12 print:opacity-40">
          <div className="border-4 border-primary p-2 rounded-full flex flex-col items-center justify-center w-32 h-32">
            <Award className="h-10 w-10 text-primary" />
            <span className="text-[8px] font-black text-center uppercase leading-tight mt-1">Garantía de Calidad<br/>Servifumiga Pro</span>
          </div>
        </div>

        {/* HEADER TÉCNICO */}
        <div className="p-12 pb-8 border-b-[8px] border-primary flex items-center justify-between bg-slate-50/50">
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
              CONSTANCIA DE OPERATIVIDAD Y SEGURIDAD
            </p>
            <div className="mt-4 bg-[#1c1c1c] text-white px-6 py-2 rounded-md font-black text-sm tracking-tight inline-block shadow-md">
              N° {certNumber}
            </div>
          </div>
        </div>

        {/* CUERPO DEL CERTIFICADO */}
        <div className="p-12 space-y-10 flex-1 relative">
          {/* MARCA DE AGUA CORPORATIVA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-45">
            <ShieldCheck className="h-[500px] w-[500px]" />
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 pb-1 tracking-widest">Beneficiario del Servicio</h3>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-900 uppercase leading-none">{apt.clientName}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">DIRECCIÓN: {apt.clientAddress || "---"}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">TIPO: {apt.serviceType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 pb-1 tracking-widest">Detalles de Vigencia</h3>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-700 uppercase">EJECUTADO EL: {formattedDate}</p>
                <p className="text-[12px] font-black text-status-success uppercase bg-status-success/5 px-2 py-1 rounded inline-block">PRÓXIMO VENCIMIENTO: {apt.nextDue || "---"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-[10px] font-black text-primary uppercase flex items-center gap-2 tracking-widest bg-slate-50 p-2 rounded">
              <CheckSquare className="h-4 w-4" /> ESPECIFICACIONES TÉCNICAS Y CONFORMIDAD
            </h3>
            
            {isFumigation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px]">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-[9px]">Ingrediente Activo / Químico:</p>
                    <p className="font-black text-slate-900 border-b-2 border-slate-50 pb-1 text-[12px] uppercase">{apt.chemicalsUsed || "NO ESPECIFICADO"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-400 uppercase text-[9px]">Dosis de Aplicación:</p>
                    <p className="font-bold text-slate-700 border-b-2 border-slate-50 pb-1">{apt.dosage || "SEGÚN FICHA TÉCNICA"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-[9px]">Control Biológico Efectuado:</p>
                  <div className="flex flex-wrap gap-2">
                    {apt.pestTargeted?.map((p: string) => (
                      <Badge key={p} variant="outline" className="bg-white border-slate-200 text-slate-700 font-black uppercase text-[9px] px-3">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px]">
                <div className="space-y-3">
                  <p className="font-black text-slate-400 uppercase text-[9px]">Puntos Críticos de Inspección:</p>
                  <ul className="space-y-2">
                    {Object.entries(apt.extChecklist || {}).map(([key, val]: [string, any]) => (
                      <li key={key} className="flex items-center justify-between border-b border-dashed border-slate-100 pb-1">
                        <span className="uppercase font-bold text-slate-600 tracking-tight">{key.replace('_', ' ')}:</span>
                        {val ? <Badge className="bg-status-success text-white text-[8px] font-black h-4 px-2">CONFORME</Badge> : <Badge variant="outline" className="text-[8px] h-4">N/A</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="font-black text-slate-400 uppercase text-[9px]">Observaciones Técnicas:</p>
                  <p className="italic text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                    {apt.observations || "El equipo se encuentra en condiciones óptimas de operatividad bajo estándares NFPA."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ÁREA DE FIRMAS Y QR */}
          <div className="pt-16 grid grid-cols-12 gap-8 items-end">
            <div className="col-span-4 text-center space-y-2">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center relative overflow-hidden">
                <span className="text-[8px] uppercase font-black text-slate-200 absolute top-0">Sello Digital de la Empresa</span>
                {/* Sello simulado */}
                <div className="border-4 border-primary/30 text-primary/30 p-1 rounded-lg rotate-12 font-black text-[10px] uppercase">
                  VERIFICADO<br/>{apt.technicianName}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-primary leading-none">{apt.technicianName}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">TÉCNICO ESPECIALISTA</p>
            </div>

            <div className="col-span-4 flex flex-col items-center justify-center space-y-2">
              <div className="bg-white p-2 border-2 border-slate-100 rounded-xl shadow-sm">
                <QrCode className="h-20 w-20 text-slate-800" />
              </div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Validar Autenticidad</p>
            </div>

            <div className="col-span-4 text-center space-y-2">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center relative">
                <span className="text-[8px] uppercase font-black text-slate-200 absolute top-0">Firma de Conformidad Cliente</span>
                {/* Simulación de firma capturada */}
                <div className="font-cursive text-2xl text-slate-700 opacity-80 -rotate-2">
                  {apt.clientSignatureName}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-primary leading-none">{apt.clientSignatureName || "---"}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">DNI: {apt.clientTaxId || "RECEPTOR"}</p>
            </div>
          </div>
        </div>

        {/* FOOTER CORPORATIVO PROFESIONAL */}
        <div 
          className="mt-auto py-8 text-center text-white print-footer"
          style={{ 
            backgroundColor: company?.primaryColor || '#1a2b3c',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          } as any}
        >
          <div className="px-12 w-full flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-[10px] font-black uppercase tracking-widest">
              {company?.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {company.email}</p>}
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 w-full max-w-lg">
              <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <Globe className="h-3 w-3" /> {company?.website || "WWW.SERVIFUMIGAPRO.PE"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
