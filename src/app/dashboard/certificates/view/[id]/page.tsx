
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
  Award,
  FileText,
  ClipboardCheck,
  CheckCircle2
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

  // Cargar equipos específicos del certificado
  const equipmentQuery = useMemoFirebase(() => {
    if (apt?.servicedEquipmentIds && apt.servicedEquipmentIds.length > 0) {
      return query(collection(db, "client_equipment"), where("id", "in", apt.servicedEquipmentIds))
    }
    return null
  }, [db, apt?.servicedEquipmentIds])
  const { data: equipment } = useCollection(equipmentQuery)

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse text-primary tracking-widest">Generando Protocolo de Seguridad...</div>
  if (!apt) return <div className="p-20 text-center font-bold uppercase">Registro no encontrado en el silo de datos</div>

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
            <Printer className="mr-2 h-3.5 w-3.5" /> Imprimir Protocolo
          </Button>
          <Button size="sm" className="bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl px-6">
            <Download className="mr-2 h-3.5 w-3.5 text-accent" /> Descargar Oficial
          </Button>
        </div>
      </div>

      {/* PROTOCOLO TÉCNICO PROFESIONAL A4 */}
      <div className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-[#1c1c1c] font-body">
        
        {/* SELLO DE SEGURIDAD FLOTANTE */}
        <div className="absolute top-48 right-12 opacity-20 rotate-12 print:opacity-40 z-0">
          <div className="border-4 border-primary p-2 rounded-full flex flex-col items-center justify-center w-36 h-32 border-double">
            <Award className="h-10 w-10 text-primary" />
            <span className="text-[8px] font-black text-center uppercase leading-tight mt-1">CALIDAD GARANTIZADA<br/>CERTIFICACIÓN ISO</span>
          </div>
        </div>

        {/* HEADER CORPORATIVO */}
        <div 
          className="p-12 pb-10 border-b-[12px] border-primary flex items-center justify-between bg-slate-50/50"
          style={{ borderBottomColor: company?.primaryColor || '#1a2b3c' }}
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
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter leading-none mb-2" style={{ color: company?.primaryColor || '#1a2b3c' }}>
              PROTOCOLO TÉCNICO
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              CONSTANCIA DE OPERATIVIDAD INDUSTRIAL
            </p>
            <div className="mt-4 bg-[#1c1c1c] text-white px-8 py-3 rounded-xl font-black text-sm tracking-widest inline-block shadow-2xl border-b-4 border-accent">
              N° {certNumber}
            </div>
          </div>
        </div>

        {/* CUERPO DEL DOCUMENTO */}
        <div className="p-12 space-y-10 flex-1 relative z-10">
          {/* MARCA DE AGUA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none -rotate-45">
            <ShieldCheck className="h-[600px] w-[600px]" />
          </div>

          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-1 tracking-[0.2em]">Entidad Beneficiaria</h3>
              <div className="space-y-1.5">
                <p className="text-lg font-black text-slate-900 uppercase leading-none">{apt.clientName}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2"><MapPin className="h-3 w-3" /> {apt.clientAddress || "---"}</p>
                <p className="text-[11px] font-black text-primary uppercase tracking-tight" style={{ color: company?.primaryColor || '#1a2b3c' }}>SERVICIO: {apt.serviceType}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-slate-50 pb-1 tracking-[0.2em]">Cronograma de Vigencia</h3>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase">EJECUTADO EL: <span className="font-black text-slate-900">{formattedDate}</span></p>
                <div className="bg-status-success/10 border-2 border-status-success/20 px-4 py-2 rounded-xl inline-block">
                  <p className="text-[12px] font-black text-status-success uppercase tracking-wider">PRÓXIMO VENCIMIENTO: {apt.nextDue || "---"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-4">
            <h3 className="text-[10px] font-black text-primary uppercase flex items-center gap-2 tracking-[0.2em] bg-slate-50 p-3 rounded-xl" style={{ color: company?.primaryColor || '#1a2b3c' }}>
              <ClipboardCheck className="h-4 w-4" /> ESPECIFICACIONES TÉCNICAS Y DECLARACIÓN DE CONFORMIDAD
            </h3>
            
            {isFumigation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-[11px]">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Protocolo Químico (Ingrediente Activo):</p>
                    <p className="font-black text-slate-900 border-b-2 border-slate-50 pb-1 text-[13px] uppercase">{apt.chemicalsUsed || "NO ESPECIFICADO"}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Dosificación Aplicada:</p>
                    <p className="font-bold text-slate-700 border-b-2 border-slate-50 pb-1 text-[12px]">{apt.dosage || "SEGÚN FICHA TÉCNICA (NTP)"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Control Biológico de Plagas:</p>
                  <div className="flex flex-wrap gap-2">
                    {apt.pestTargeted?.map((p: string) => (
                      <Badge key={p} variant="outline" className="bg-white border-slate-200 text-slate-800 font-black uppercase text-[10px] px-4 py-1 rounded-lg shadow-sm">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {equipment && equipment.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Inventario de Equipos Certificados:</p>
                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-[10px]">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="p-3 text-left font-black uppercase tracking-wider">N° Serie / Placa</th>
                            <th className="p-3 text-left font-black uppercase tracking-wider">Tipo / Marca</th>
                            <th className="p-3 text-left font-black uppercase tracking-wider">Ubicación Registrada</th>
                            <th className="p-3 text-right font-black uppercase tracking-wider">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipment.map(item => (
                            <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="p-3 font-black text-primary">{item.serialNumber}</td>
                              <td className="p-3 font-bold text-slate-600 uppercase">{item.type} {item.brand}</td>
                              <td className="p-3 font-bold text-slate-500 uppercase">{item.location}</td>
                              <td className="p-3 text-right">
                                <span className="bg-status-success text-white text-[8px] font-black px-3 py-1 rounded-full">OPERATIVO</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-[11px]">
                  <div className="space-y-4">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Puntos Críticos de Inspección (NFPA):</p>
                    <ul className="space-y-2.5">
                      {Object.entries(apt.extChecklist || {}).map(([key, val]: [string, any]) => (
                        <li key={key} className="flex items-center justify-between border-b border-dashed border-slate-100 pb-1.5">
                          <span className="uppercase font-bold text-slate-600 tracking-tight">{key.replace('_', ' ')}:</span>
                          {val ? (
                            <Badge className="bg-status-success text-white text-[8px] font-black h-5 px-3 rounded-md">CONFORME</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] h-5 px-3 rounded-md opacity-30">N/A</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <p className="font-black text-slate-400 uppercase text-[9px] tracking-widest">Observaciones Técnicas Finales:</p>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 relative">
                      <FileText className="absolute top-4 right-4 h-4 w-4 text-slate-200" />
                      <p className="italic text-slate-700 leading-relaxed font-bold uppercase text-[10px]">
                        {apt.observations || "El parque de extintores inspeccionado cumple con los parámetros de presión y operatividad bajo la Norma Técnica Peruana 350.043-1."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ÁREA DE AUTENTICACIÓN */}
          <div className="pt-16 grid grid-cols-12 gap-12 items-end">
            <div className="col-span-4 text-center space-y-3">
              <div className="h-28 w-full border-b-2 border-slate-300 flex items-center justify-center relative overflow-hidden bg-slate-50/30 rounded-t-xl">
                <span className="text-[8px] uppercase font-black text-slate-200 absolute top-2">Firma Digital del Técnico</span>
                <div className="border-4 border-primary/20 text-primary/20 p-2 rounded-xl rotate-12 font-black text-[11px] uppercase border-double">
                  VALIDADO<br/>{apt.technicianName}
                </div>
              </div>
              <p className="text-[11px] font-black uppercase text-primary leading-none" style={{ color: company?.primaryColor || '#1a2b3c' }}>{apt.technicianName}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">TÉCNICO COLEGIADO</p>
            </div>

            <div className="col-span-4 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 border-4 border-slate-100 rounded-[2rem] shadow-xl">
                <QrCode className="h-24 w-24 text-slate-800" />
              </div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">VALIDAR DOCUMENTO</p>
            </div>

            <div className="col-span-4 text-center space-y-3">
              <div className="h-28 w-full border-b-2 border-slate-300 flex items-center justify-center relative bg-slate-50/30 rounded-t-xl">
                <span className="text-[8px] uppercase font-black text-slate-200 absolute top-2">Conformidad del Cliente</span>
                <div className="font-cursive text-3xl text-slate-800 opacity-70 -rotate-3 tracking-tighter">
                  {apt.clientSignatureName}
                </div>
              </div>
              <p className="text-[11px] font-black uppercase text-primary leading-none" style={{ color: company?.primaryColor || '#1a2b3c' }}>{apt.clientSignatureName || "---"}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">RECEPTOR AUTORIZADO</p>
            </div>
          </div>
        </div>

        {/* FOOTER CORPORATIVO */}
        <div 
          className="mt-auto py-10 text-center text-white print-footer"
          style={{ 
            backgroundColor: company?.primaryColor || '#1a2b3c',
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
