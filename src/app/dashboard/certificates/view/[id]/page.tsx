
"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
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
  FileText,
  CheckCircle2,
  FlaskConical,
  Activity,
  Scale
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

  const equipmentQuery = useMemoFirebase(() => {
    if (apt?.servicedEquipmentIds && apt.servicedEquipmentIds.length > 0) {
      return query(collection(db, "client_equipment"), where("id", "in", apt.servicedEquipmentIds))
    }
    return null
  }, [db, apt?.servicedEquipmentIds])
  const { data: equipment } = useCollection(equipmentQuery)

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse text-primary tracking-widest">Generando Documentación Oficial...</div>
  if (!apt) return <div className="p-20 text-center font-bold uppercase">Registro no encontrado</div>

  const isFumigation = apt.serviceType === "Fumigación"
  const formattedDate = apt.date ? format(parseISO(apt.date), "dd 'de' MMMM 'del' yyyy", { locale: es }) : "---"
  const certNumber = apt.certificateNumber || `CERT-${apt.id.split('-')[0].toUpperCase()}`

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft className="mr-2 h-3 w-3" /> Regresar al Registro
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-black uppercase text-[10px] tracking-widest border-2">
            <Printer className="mr-2 h-3.5 w-3.5" /> Imprimir Documento
          </Button>
          <Button size="sm" className="bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl px-6">
            <Download className="mr-2 h-3.5 w-3.5 text-accent" /> Descargar PDF
          </Button>
        </div>
      </div>

      <div className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-[#1c1c1c] font-body">
        
        {/* HEADER DIFERENCIADO */}
        <div 
          className={cn(
            "p-12 pb-8 border-b-[12px] flex items-center justify-between",
            isFumigation ? "bg-emerald-50/30 border-emerald-600" : "bg-slate-50/50 border-primary"
          )}
          style={{ borderBottomColor: isFumigation ? '#059669' : (company?.primaryColor || '#1a2b3c') }}
        >
          <div className="relative h-24 w-64">
            {company?.logoUrl ? (
              <Image src={company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
            ) : (
              <div className="h-full w-full bg-slate-200 flex items-center justify-center rounded-xl border-2 border-dashed">
                <ShieldCheck className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1" style={{ color: isFumigation ? '#065f46' : (company?.primaryColor || '#1a2b3c') }}>
              {isFumigation ? "CERTIFICADO DE SANEAMIENTO AMBIENTAL" : "CERTIFICADO DE OPERATIVIDAD"}
            </h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              {isFumigation ? "RESOLUCIÓN DIRECTORAL DIRIS / DIGESA" : "NORMA TÉCNICA PERUANA NTP 350.043-1"}
            </p>
            <div className="mt-4 bg-[#1c1c1c] text-white px-8 py-3 rounded-xl font-black text-sm tracking-widest inline-block shadow-2xl border-b-4 border-accent">
              FOLIO N° {certNumber}
            </div>
          </div>
        </div>

        <div className="p-12 space-y-8 flex-1 relative z-10">
          {/* MARCA DE AGUA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-45">
            {isFumigation ? <FlaskConical className="h-[500px] w-[500px]" /> : <ShieldCheck className="h-[500px] w-[500px]" />}
          </div>

          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-1 tracking-[0.2em]">Entidad Beneficiaria</h3>
              <div className="space-y-1.5">
                <p className="text-lg font-black text-slate-900 uppercase leading-none">{apt.clientName}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2"><MapPin className="h-3 w-3" /> {apt.clientAddress || "---"}</p>
                <Badge variant="outline" className="mt-2 text-[9px] font-black uppercase border-slate-200">RUC: {apt.clientTaxId || "REGISTRADO"}</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-1 tracking-[0.2em]">Vigencia del Certificado</h3>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase">FECHA DE EMISIÓN: <span className="font-black text-slate-900">{formattedDate}</span></p>
                <div className={cn(
                  "px-4 py-2 rounded-xl inline-block border-2",
                  isFumigation ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
                )}>
                  <p className={cn(
                    "text-[12px] font-black uppercase tracking-wider",
                    isFumigation ? "text-emerald-700" : "text-blue-700"
                  )}>PRÓXIMO VENCIMIENTO: {apt.nextDue || "---"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN FUMIGACIÓN */}
          {isFumigation && (
            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-3 bg-emerald-600 text-white p-3 rounded-xl">
                <Activity className="h-5 w-5" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">ESPECIFICACIONES TÉCNICAS DE SANEAMIENTO</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-3">Protocolo Químico Aplicado:</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Ingrediente Activo / Producto:</p>
                        <p className="font-black text-slate-900 text-sm uppercase">{apt.chemicalsUsed || "CYPERMETRINA 20% EC"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Dosificación / Concentración:</p>
                        <p className="font-bold text-slate-700 text-xs">{apt.dosage || "10ML POR LITRO DE AGUA"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Control de Vectores y Plagas:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(apt.pestTargeted || ["Insectos rastreros", "Insectos voladores"]).map((p: string) => (
                      <div key={p} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span className="text-[9px] font-black uppercase text-emerald-800">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN EXTINTORES */}
          {!isFumigation && (
            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-3 bg-primary text-white p-3 rounded-xl">
                <Scale className="h-5 w-5" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">PROTOCOLO DE INSPECCIÓN Y OPERATIVIDAD NTP</h3>
              </div>

              {equipment && equipment.length > 0 ? (
                <div className="border rounded-2xl overflow-hidden shadow-sm border-slate-200">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3 text-left font-black uppercase">N° Serie / Placa</th>
                        <th className="p-3 text-left font-black uppercase">Tipo / Agente / Capacidad</th>
                        <th className="p-3 text-left font-black uppercase">Ubicación</th>
                        <th className="p-3 text-right font-black uppercase">Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map(item => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="p-3 font-black text-primary">{item.serialNumber}</td>
                          <td className="p-3 font-bold text-slate-600 uppercase">{item.type} {item.extinguishingAgent} {item.capacity}</td>
                          <td className="p-3 font-bold text-slate-500 uppercase">{item.location}</td>
                          <td className="p-3 text-right">
                            <Badge className="bg-emerald-600 text-white text-[8px] font-black px-3 py-1 rounded-full border-none">CONFORME</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed rounded-2xl text-center bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Inspección de operatividad según lote de mantenimiento.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px]">
                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Observaciones Técnicas:</p>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 relative min-h-[120px]">
                    <FileText className="absolute top-4 right-4 h-4 w-4 text-slate-200" />
                    <p className="italic text-slate-700 leading-relaxed font-bold uppercase text-[10px]">
                      {apt.observations || "Se certifica que los equipos han sido sometidos a pruebas de operatividad, cumpliendo con los estándares establecidos por la normativa nacional vigente."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-center space-y-3">
                  <div className="bg-white p-3 border-4 border-slate-100 rounded-[2rem] shadow-xl">
                    <QrCode className="h-24 w-24 text-slate-800" />
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">VALIDAR CERTIFICADO</p>
                </div>
              </div>
            </div>
          )}

          {/* ÁREA DE FIRMAS */}
          <div className="pt-12 grid grid-cols-2 gap-24 text-center">
            <div className="space-y-3">
              <div className="h-28 w-full border-b-2 border-slate-300 flex items-center justify-center bg-slate-50/30 rounded-t-xl">
                <div className="border-4 border-primary/20 text-primary/20 p-2 rounded-xl rotate-12 font-black text-[11px] uppercase border-double">
                  VALIDADO<br/>{apt.technicianName || "JEFE TÉCNICO"}
                </div>
              </div>
              <p className="text-[11px] font-black uppercase text-primary">{apt.technicianName || "DPTO. TÉCNICO"}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">FIRMA Y SELLO AUTORIZADO</p>
            </div>

            <div className="space-y-3">
              <div className="h-28 w-full border-b-2 border-slate-300 flex items-center justify-center bg-slate-50/30 rounded-t-xl">
                <div className="font-cursive text-3xl text-slate-800 opacity-70 -rotate-3 tracking-tighter">
                  {apt.clientSignatureName}
                </div>
              </div>
              <p className="text-[11px] font-black uppercase text-primary">{apt.clientSignatureName || "---"}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">RECEPTOR CONFORME</p>
            </div>
          </div>
        </div>

        {/* FOOTER CORPORATIVO */}
        <div 
          className="mt-auto py-10 text-center text-white print-footer"
          style={{ 
            backgroundColor: isFumigation ? '#064e3b' : (company?.primaryColor || '#1a2b3c'),
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          } as any}
        >
          <div className="px-12 w-full flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em]">
              {company?.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> {company.email}</p>}
            </div>
            <div className="pt-4 border-t border-white/10 w-full max-w-2xl">
              <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
                <Globe className="h-4 w-4" /> {company?.website || "WWW.SERVIFUMIGAPRO.PE"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
