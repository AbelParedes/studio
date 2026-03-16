
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
  MapPin,
  Phone,
  Mail,
  Globe,
  QrCode,
  FileText,
  CheckCircle2,
  FlaskConical,
  Activity,
  Scale,
  Wrench
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
        
        {/* HEADER LIMPIO (Igual a Cotizaciones) */}
        <div className="pt-12 px-12 pb-8 shrink-0 flex items-center justify-between bg-slate-50/50">
          <div className="relative h-20 w-64">
            {(company?.headerUrl || company?.logoUrl) ? (
              <Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
            ) : (
              <div className="h-full w-full bg-white border-2 border-dashed border-slate-200 flex items-center justify-center rounded">
                <ShieldCheck className="h-10 w-10 text-slate-300" />
              </div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-sm font-black text-primary uppercase tracking-tighter leading-none mb-1">
              {isFumigation ? "CERTIFICADO DE SANEAMIENTO AMBIENTAL" : "CERTIFICADO DE OPERATIVIDAD"}
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              {isFumigation ? "RESOLUCIÓN DIRECTORAL DIRIS / DIGESA" : "NORMA TÉCNICA PERUANA NTP 350.043-1"}
            </p>
            <div className="bg-[#1c1c1c] text-white px-6 py-2 rounded font-black text-xs tracking-widest inline-block shadow-sm border-b-2 border-slate-400">
              FOLIO N° {certNumber}
            </div>
          </div>
        </div>

        <div className="p-12 space-y-10 flex-1 relative z-10">
          {/* MARCA DE AGUA SUTIL */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none -rotate-45">
            {isFumigation ? <FlaskConical className="h-[500px] w-[500px]" /> : <ShieldCheck className="h-[500px] w-[500px]" />}
          </div>

          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">ENTIDAD BENEFICIARIA</h3>
                <div className="h-[1px] bg-slate-100 w-full"></div>
              </div>
              <div className="space-y-1 pt-1">
                <p className="text-lg font-black text-[#1c1c1c] uppercase leading-none">{apt.clientName}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2"><MapPin className="h-3 w-3" /> {apt.clientAddress || "---"}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">RUC: {apt.clientTaxId || "REGISTRADO"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">VIGENCIA TÉCNICA</h3>
                <div className="h-[1px] bg-slate-100 w-full"></div>
              </div>
              <div className="text-[11px] space-y-2 pt-1 text-right">
                <p className="font-bold text-slate-700 uppercase">FECHA DE EMISIÓN: <span className="font-black text-[#1c1c1c]">{formattedDate}</span></p>
                <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded inline-block">
                  <p className="text-[12px] font-black uppercase tracking-wider text-primary">PRÓXIMO VENCIMIENTO: {apt.nextDue || "---"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN FUMIGACIÓN (ESTILO PROFESIONAL SLATE) */}
          {isFumigation && (
            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1c1c1c]">ESPECIFICACIONES TÉCNICAS DE SANEAMIENTO</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest mb-4">Protocolo Químico Aplicado:</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Ingrediente Activo / Producto:</p>
                        <p className="font-black text-primary text-sm uppercase">{apt.chemicalsUsed || "CYPERMETRINA 20% EC"}</p>
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
                      <div key={p} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                        <CheckCircle2 className="h-3 w-3 text-primary opacity-50" />
                        <span className="text-[9px] font-black uppercase text-slate-700">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN EXTINTORES (ESTILO PROFESIONAL SLATE) */}
          {!isFumigation && (
            <div className="space-y-8 pt-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                <Scale className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1c1c1c]">PROTOCOLO DE INSPECCIÓN Y OPERATIVIDAD NTP</h3>
              </div>

              {equipment && equipment.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3 text-left font-black uppercase">N° SERIE / PLACA</th>
                        <th className="p-3 text-left font-black uppercase">TIPO / AGENTE / CAPACIDAD</th>
                        <th className="p-3 text-left font-black uppercase">UBICACIÓN</th>
                        <th className="p-3 text-right font-black uppercase">RESULTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map(item => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-black text-primary">{item.serialNumber}</td>
                          <td className="p-3 font-bold text-slate-600 uppercase">{item.type} {item.extinguishingAgent} {item.capacity}</td>
                          <td className="p-3 font-bold text-slate-500 uppercase">{item.location}</td>
                          <td className="p-3 text-right">
                            <Badge variant="outline" className="text-[8px] font-black px-3 py-0.5 rounded-full border-primary/20 bg-primary/5 text-primary">CONFORME</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed rounded-xl text-center bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Inspección de operatividad según lote de mantenimiento.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px]">
                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Observaciones Técnicas:</p>
                  <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 relative min-h-[120px]">
                    <FileText className="absolute top-4 right-4 h-4 w-4 text-slate-200" />
                    <p className="italic text-slate-700 leading-relaxed font-bold uppercase text-[10px]">
                      {apt.observations || "Se certifica que los equipos han sido sometidos a pruebas de operatividad, cumpliendo con los estándares establecidos por la normativa nacional vigente."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-end items-center space-y-3">
                  <div className="bg-white p-3 border-4 border-slate-100 rounded shadow-xl">
                    <QrCode className="h-20 w-24 text-slate-800" />
                  </div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">VALIDAR CERTIFICADO</p>
                </div>
              </div>
            </div>
          )}

          {/* ÁREA DE FIRMAS UNIFICADA */}
          <div className="pt-16 grid grid-cols-2 gap-24 text-center">
            <div className="space-y-3">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center bg-slate-50/30 rounded-t-lg relative">
                <div className="border-4 border-primary/10 text-primary/10 p-2 rounded-xl rotate-12 font-black text-[11px] uppercase border-double absolute">
                  VALIDADO POR<br/>SISTEMA CENTRAL
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{apt.technicianName || "DPTO. TÉCNICO"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">FIRMA Y SELLO AUTORIZADO</p>
            </div>

            <div className="space-y-3">
              <div className="h-24 w-full border-b-2 border-slate-300 flex items-center justify-center bg-slate-50/30 rounded-t-lg">
                <div className="text-2xl text-slate-800 opacity-70 -rotate-2 tracking-tighter italic font-medium">
                  {apt.clientSignatureName}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{apt.clientSignatureName || "---"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">RECEPTOR CONFORME</p>
            </div>
          </div>
        </div>

        {/* FOOTER CORPORATIVO (Igual a Orden de Servicio) */}
        <div 
          className="mt-auto shrink-0 flex flex-col items-center justify-center py-8 print-footer"
          style={{ 
            backgroundColor: company?.footerBgColor || '#f8fafc',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            borderTop: '1px solid #e2e8f0'
          } as any}
        >
          <div className="px-12 w-full flex flex-col items-center text-center gap-3 text-slate-600">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-1 text-[10px] font-black uppercase tracking-wider">
              {company?.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 opacity-50" /> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 opacity-50" /> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 opacity-50" /> {company.email}</p>}
            </div>
            <div className="mt-1 pt-3 border-t border-slate-200/50 w-full max-w-lg">
              <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                <Globe className="h-3.5 w-3.5" /> {company?.website || "WWW.SERVIFUMIGAPRO.PE"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
