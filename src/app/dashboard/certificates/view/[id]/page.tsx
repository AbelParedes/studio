
"use client"

import { use, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Globe,
  MapPin,
  Phone,
  Mail
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"

const EXTINPRO_DEFAULT_LOGO = "https://img.freepik.com/vector-gratis/estilo-plano-llama_78370-7477.jpg?semt=ais_incoming&w=740&q=80"

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const [currentUrl, setCurrentUrl] = useState("")

  useEffect(() => { if (typeof window !== "undefined") setCurrentUrl(window.location.href) }, [])

  const certRef = useMemoFirebase(() => id ? doc(db, "certificates", id) : null, [db, id])
  const { data: cert, isLoading } = useDoc(certRef)

  const companyRef = useMemoFirebase(() => cert?.companyId ? doc(db, "companies", cert.companyId) : null, [db, cert?.companyId])
  const { data: company } = useDoc(companyRef)

  const clientRef = useMemoFirebase(() => cert?.clienteId ? doc(db, "clients", cert.clienteId) : null, [db, cert?.clienteId])
  const { data: client } = useDoc(clientRef)

  const techRef = useMemoFirebase(() => cert?.technicianId ? doc(db, "company_users", cert.technicianId) : null, [db, cert?.technicianId])
  const { data: technician } = useDoc(techRef)

  // Lógica dinámica para clases de fuego
  const dynamicFireClasses = useMemo(() => {
    if (!cert?.datosExtintor || cert.datosExtintor.length === 0) return "clase ABC"
    
    const classes = new Set<string>()
    cert.datosExtintor.forEach((item: any) => {
      const type = item.tipo?.toUpperCase() || ""
      if (type.includes("PQS")) classes.add("ABC")
      else if (type.includes("CO2")) classes.add("BC")
      else if (type.includes("H2O") || type.includes("AGUA")) classes.add("A")
      else if (type.includes("K") || type.includes("ACETATO") || type.includes("POTASIO")) classes.add("K")
    })

    if (classes.size === 0) return "clase ABC"
    return `clase ${Array.from(classes).sort().join(" / ")}`
  }, [cert?.datosExtintor])

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse text-primary">Generando Protocolo Oficial...</div>
  if (!cert) return <div className="p-20 text-center font-bold uppercase">Protocolo no encontrado</div>

  return (
    <div className="space-y-6 pb-20 bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="flex items-center justify-between max-w-[210mm] mx-auto print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[10px] tracking-widest"><ArrowLeft className="mr-2 h-3 w-3" /> Regresar</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-bold uppercase text-[10px] tracking-widest border-2"><Printer className="mr-2 h-3.5 w-3.5" /> Imprimir</Button>
          <Button size="sm" className="bg-primary text-white font-bold uppercase text-[10px] tracking-widest shadow-xl px-6"><Download className="mr-2 h-3.5 w-3.5" /> Descargar</Button>
        </div>
      </div>

      <div className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-black font-serif">
        
        {/* CABECERA DINÁMICA */}
        <div className="pt-10 px-14 pb-4 shrink-0">
          <div className="flex flex-col items-start">
            <div className="relative h-20 w-64">
              <Image src={company?.headerUrl || company?.logoUrl || EXTINPRO_DEFAULT_LOGO} alt="Logo" fill className="object-contain object-left" unoptimized />
            </div>
          </div>
          <div className="mt-4 border-t-[3px] border-b-[1px] border-slate-300 h-1.5 w-full"></div>
        </div>

        <div className="px-14 flex-1 relative z-10">
          {/* MARCA DE AGUA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none -rotate-12">
            <div className="relative h-[400px] w-[400px]">
              <Image src={company?.logoUrl || EXTINPRO_DEFAULT_LOGO} alt="Watermark" fill className="object-contain" unoptimized />
            </div>
          </div>

          {/* TITULO AJUSTADO */}
          <h1 className="text-center text-[26px] font-bold underline mb-10 mt-4 tracking-wide uppercase">
            CERTIFICADO DE OPERATIVIDAD
          </h1>

          {/* CUERPO DE TEXTO ESTRUCTURADO */}
          <div className="space-y-6 text-[14px] leading-relaxed text-justify">
            <p>
              La empresa <span className="font-bold">&quot;{company?.name || "EXTINPRO"}&quot;</span>, certifica que los extintores pertenecientes a:
            </p>
            
            <div className="pl-4 space-y-1.5">
              <p><span className="font-bold uppercase w-24 inline-block">A:</span> <span className="text-[16px] font-bold">{cert.clienteNombre}</span></p>
              <p><span className="font-bold uppercase w-24 inline-block">RUC:</span> <span className="font-bold">{client?.taxId || "---"}</span></p>
              <p>
                <span className="font-bold uppercase w-24 inline-block">{cert.certificationType === "Vehículo" ? "PLACA / UNID:" : "DIRECCIÓN:"}</span>
                <span className="font-bold">{cert.targetDetail || client?.address || "---"}</span>
              </p>
            </div>

            <p className="mt-4">
              han sido inspeccionados y/o cargados bajo las especificaciones técnicas vigentes, cumpliendo estrictamente con la normativa <span className="font-bold">NTP 350.043 y ISO 9001</span>.
            </p>

            <p className="font-bold italic">Extinción de fuegos {dynamicFireClasses} / Operatividad Técnica.</p>

            {/* PARAMETROS TECNICOS COMPACTOS */}
            <div className="flex justify-around items-center font-mono text-[12px] border-y-2 border-black py-3 my-4 bg-slate-50/50">
              <p className="flex gap-2">
                <span className="uppercase font-bold">Presión Prueba:</span> <span>{cert.presionPrueba || "---"}</span>
              </p>
              <div className="h-4 w-[1px] bg-slate-300"></div>
              <p className="flex gap-2">
                <span className="uppercase font-bold">Presión Trabajo:</span> <span>{cert.presionTrabajo || "---"}</span>
              </p>
              <div className="h-4 w-[1px] bg-slate-300"></div>
              <p className="flex gap-2">
                <span className="uppercase font-bold">Rating:</span> <span>{cert.rating || "---"}</span>
              </p>
            </div>

            <h2 className="text-[15px] font-bold underline mt-8 uppercase">
              ANEXO TÉCNICO DE EQUIPOS (NTP 350.026 / 350.043)
            </h2>

            {/* TABLA TÉCNICA REESTRUCTURADA */}
            <div className="mt-4 border-2 border-black rounded shadow-sm overflow-hidden">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-slate-50 text-black border-b-2 border-black">
                  <tr className="font-bold uppercase text-center">
                    <th className="p-2 border-r border-black w-10">N°</th>
                    <th className="p-2 border-r border-black w-20">CAP</th>
                    <th className="p-2 border-r border-black w-32">TIPO</th>
                    <th className="p-2 border-r border-black">NS - FF</th>
                    <th className="p-2 border-r border-black">VCTO - PH</th>
                    <th className="p-2 border-r border-black">RECARGA</th>
                    <th className="p-2">VCTO RECARGA</th>
                  </tr>
                </thead>
                <tbody>
                  {cert.datosExtintor?.map((item: any, idx: number) => {
                    const formatMY = (d: string) => {
                      if (!d || d === "---") return "---"
                      try { return format(parseISO(d), "MM / yy", { locale: es }).toUpperCase() } catch { return d }
                    }
                    return (
                      <tr key={idx} className="border-b border-black last:border-0 text-center font-bold">
                        <td className="p-2 border-r border-black">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="p-2 border-r border-black">{item.cap}</td>
                        <td className="p-2 border-r border-black">{item.tipo}</td>
                        <td className="p-2 border-r border-black">{item.ns} - {item.ff}</td>
                        <td className="p-2 border-r border-black">{formatMY(item.vctoPH)}</td>
                        <td className="p-2 border-r border-black">{formatMY(item.recarga)}</td>
                        <td className="p-2">{formatMY(item.vctoRecarga)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-8">
              Se emite el presente protocolo de operatividad para los fines que el beneficiario estime conveniente, garantizando la seguridad industrial en las instalaciones o unidades descritas.
            </p>
          </div>

          {/* SECCIÓN DE FIRMAS */}
          <div className="mt-20 grid grid-cols-2 gap-24 text-center">
            <div className="space-y-2">
              <div className="h-24 w-full border-b border-black flex flex-col items-center justify-end pb-2 relative">
                {company?.signatureUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image src={company.signatureUrl} alt="Sello Empresa" width={160} height={80} className="object-contain opacity-90" unoptimized />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-bold uppercase">{company?.name || "GERENCIA GENERAL"}</p>
              <p className="text-[10px] font-medium uppercase text-slate-500">Firma y Sello Autorizado</p>
            </div>

            <div className="space-y-2">
              <div className="h-24 w-full border-b border-black flex flex-col items-center justify-end pb-2 relative">
                {technician?.signatureUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image src={technician.signatureUrl} alt="Firma Técnico" width={160} height={80} className="object-contain" unoptimized />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-bold uppercase">{cert.technicianName}</p>
              <p className="text-[10px] font-medium uppercase text-slate-500">Técnico Especialista NTP</p>
            </div>
          </div>
        </div>

        {/* PIE DE PAGINA PERSONALIZADO */}
        <div 
          className="mt-auto py-6 px-14 border-t border-slate-100 print:bg-transparent"
          style={{ backgroundColor: company?.footerBgColor || '#f8fafc' } as any}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-[9px] font-black text-slate-600 uppercase">
              {company?.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {company.email}</p>}
            </div>
            <div className="flex justify-center items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {company?.website && <p className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {company.website}</p>}
              <p>Validación Digital EXTINPRO v3.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
