
"use client"

import { use, useEffect, useState, useMemo, useRef } from "react"
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
  Mail,
  Loader2,
  Wrench
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const EXTINPRO_DEFAULT_LOGO = "https://img.freepik.com/vector-gratis/estilo-plano-llama_78370-7477.jpg?semt=ais_incoming&w=740&q=80"

export default function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const [isDownloading, setIsDownloading] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  const certRef = useMemoFirebase(() => id ? doc(db, "certificates", id) : null, [db, id])
  const { data: cert, isLoading } = useDoc(certRef)

  const companyRef = useMemoFirebase(() => cert?.companyId ? doc(db, "companies", cert.companyId) : null, [db, cert?.companyId])
  const { data: company } = useDoc(companyRef)

  const clientRef = useMemoFirebase(() => cert?.clienteId ? doc(db, "clients", cert.clienteId) : null, [db, cert?.clienteId])
  const { data: client } = useDoc(clientRef)

  const techRef = useMemoFirebase(() => cert?.technicianId ? doc(db, "company_users", cert.technicianId) : null, [db, cert?.technicianId])
  const { data: technician } = useDoc(techRef)

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

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return
    setIsDownloading(true)
    
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight)
      
      pdf.save(`CERTIFICADO-${cert?.certificadoNumero || 'DOCUMENTO'}.pdf`)
    } catch (error) {
      console.error("PDF Error:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse text-primary">Generando Protocolo Oficial...</div>
  if (!cert) return <div className="p-20 text-center font-bold uppercase">Protocolo no encontrado</div>

  return (
    <div className="space-y-6 pb-20 bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="flex items-center justify-between max-w-[210mm] mx-auto print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[10px] tracking-widest"><ArrowLeft className="mr-2 h-3 w-3" /> Regresar</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-bold uppercase text-[10px] tracking-widest border-2"><Printer className="mr-2 h-3.5 w-3.5" /> Imprimir</Button>
          <Button 
            size="sm" 
            className="bg-primary text-white font-bold uppercase text-[10px] tracking-widest shadow-xl px-6"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
            Descargar
          </Button>
        </div>
      </div>

      <div 
        ref={documentRef}
        className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-black font-sans"
      >
        {/* Cabecera Compacta */}
        <div className="pt-6 px-12 pb-2 shrink-0">
          <div className="flex justify-between items-start">
            <div className="relative h-16 w-56">
              <Image src={company?.headerUrl || company?.logoUrl || EXTINPRO_DEFAULT_LOGO} alt="Logo" fill className="object-contain object-left" unoptimized />
            </div>
            <div className="text-right">
              <h2 className="text-[12px] font-black uppercase text-primary tracking-tighter mb-0.5">{company?.name || "EXTINPRO"}</h2>
              <p className="text-[9px] font-bold text-slate-600">RUC: {company?.taxId || "---"}</p>
              <div className="mt-1 bg-slate-100 px-3 py-1 rounded font-black text-[11px] shadow-sm border-b-2 border-slate-300">
                CERTIFICADO N° {cert.certificadoNumero}
              </div>
            </div>
          </div>
          <div className="mt-2 border-t-[2px] border-b-[0.5px] border-slate-300 h-1 w-full"></div>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="px-12 flex-1 relative z-10 flex flex-col">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12">
            <div className="relative h-[350px] w-[350px]">
              <Image src={company?.logoUrl || EXTINPRO_DEFAULT_LOGO} alt="Watermark" fill className="object-contain" unoptimized />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-center text-[22px] font-bold underline mb-4 mt-2 tracking-wide uppercase">
              CERTIFICADO DE OPERATIVIDAD
            </h1>

            <div className="space-y-2 text-[12px] leading-tight text-justify">
              <p>
                La empresa <span className="font-bold">&quot;{company?.name || "EXTINPRO"}&quot;</span>, certifica que los extintores pertenecientes a:
              </p>
              
              <div className="pl-2 space-y-1">
                <div className="flex items-start">
                  <span className="font-bold uppercase w-56 shrink-0">EMPRESA O RAZÓN SOCIAL:</span> 
                  <span className="text-[13px] font-bold uppercase">{cert.clienteNombre}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold uppercase w-56 shrink-0">RUC:</span> 
                  <span className="font-bold">{client?.taxId || "---"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold uppercase w-56 shrink-0">
                    {cert.certificationType === "Vehículo" ? "PLACA / UNID:" : "DIRECCIÓN:"}
                  </span>
                  <span className="font-bold uppercase">{cert.targetDetail || client?.address || "---"}</span>
                </div>
              </div>

              <p className="mt-2">
                han sido inspeccionados y/o cargados bajo las especificaciones técnicas vigentes, cumpliendo estrictamente con la normativa <span className="font-bold">NTP 350.043 y ISO 9001</span>.
              </p>

              <p className="font-bold italic">Extinción de fuegos {dynamicFireClasses} / Operatividad Técnica.</p>

              <div className="flex justify-around items-center font-mono text-[10px] border-y-[1.5px] border-black py-2 my-2 bg-slate-50/50">
                <p className="flex gap-2">
                  <span className="uppercase font-bold">Presión Prueba:</span> <span>{cert.presionPrueba || "---"}</span>
                </p>
                <div className="h-3 w-[1px] bg-slate-300"></div>
                <p className="flex gap-2">
                  <span className="uppercase font-bold">Presión Trabajo:</span> <span>{cert.presionTrabajo || "---"}</span>
                </p>
                <div className="h-3 w-[1px] bg-slate-300"></div>
                <p className="flex gap-2">
                  <span className="uppercase font-bold">Rating:</span> <span>{cert.rating || "---"}</span>
                </p>
              </div>

              <h2 className="text-[13px] font-bold underline mt-4 uppercase">
                ANEXO TÉCNICO DE EQUIPOS (NTP 350.026 / 350.043)
              </h2>

              <div className="mt-2 border-[1.5px] border-black rounded shadow-sm overflow-hidden">
                <table className="w-full text-[10px] border-collapse">
                  <thead className="bg-slate-50 text-black border-b-[1.5px] border-black">
                    <tr className="font-bold uppercase text-center">
                      <th className="p-1 border-r border-black w-7">N°</th>
                      <th className="p-1 border-r border-black">TIPO</th>
                      <th className="p-1 border-r border-black w-14">CAP</th>
                      <th className="p-1 border-r border-black w-24">NS (Serie)</th>
                      <th className="p-1 border-r border-black w-14">FF (Fab.)</th>
                      <th className="p-1 border-r border-black w-20">RECARGA</th>
                      <th className="p-1 border-r border-black w-20">VCTO REC.</th>
                      <th className="p-1 w-20">VCTO PH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cert.datosExtintor?.map((item: any, idx: number) => {
                      const formatMY = (d: string) => {
                        if (!d || d === "---") return "---"
                        try { return format(parseISO(d), "MM / yy", { locale: es }).toUpperCase() } catch { return d }
                      }
                      return (
                        <tr key={idx} className="border-b border-black last:border-0 text-center font-bold h-6">
                          <td className="p-0.5 border-r border-black">{(idx + 1).toString().padStart(2, '0')}</td>
                          <td className="p-0.5 border-r border-black text-left pl-2">{item.tipo}</td>
                          <td className="p-0.5 border-r border-black">{item.cap}</td>
                          <td className="p-0.5 border-r border-black">{item.ns}</td>
                          <td className="p-0.5 border-r border-black">{item.ff}</td>
                          <td className="p-0.5 border-r border-black">{formatMY(item.recarga)}</td>
                          <td className="p-0.5 border-r border-black">{formatMY(item.vctoRecarga)}</td>
                          <td className="p-0.5">{formatMY(item.vctoPH)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-[11px]">
                Se emite el presente protocolo de operatividad para los fines que el beneficiario estime conveniente, garantizando la seguridad industrial en las instalaciones o unidades descritas bajo responsabilidad del personal técnico acreditado.
              </p>
            </div>
          </div>

          {/* Firmas Compactas - Posicionadas abajo */}
          <div className="mt-auto pt-10 pb-6 grid grid-cols-2 gap-20 text-center break-inside-avoid">
            <div className="space-y-1">
              <div className="h-20 w-full border-b border-black flex flex-col items-center justify-end pb-1 relative">
                {company?.signatureUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image src={company.signatureUrl} alt="Sello Empresa" width={140} height={70} className="object-contain opacity-90" unoptimized />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase">{company?.name || "GERENCIA GENERAL"}</p>
              <p className="text-[9px] font-medium uppercase text-slate-500">Sello de Gerencia</p>
            </div>

            <div className="space-y-1">
              <div className="h-20 w-full border-b border-black flex flex-col items-center justify-end pb-1 relative">
                {technician?.signatureUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image src={technician.signatureUrl} alt="Firma Técnico" width={140} height={70} className="object-contain" unoptimized />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase">{cert.technicianName}</p>
              <p className="text-[9px] font-medium uppercase text-slate-500">Especialista Técnico NTP</p>
            </div>
          </div>
        </div>

        {/* Pie de Página Unificado (OS Model) */}
        <div 
          className="mt-auto shrink-0 flex flex-col items-center justify-center py-8 print-footer"
          style={{ 
            backgroundColor: company?.footerBgColor || '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          } as any}
        >
          <div className="px-12 w-full flex flex-col items-center text-center gap-2">
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-1 text-[11px] font-black text-slate-700 uppercase">
              {company?.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {company.address}</p>}
              {company?.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /> {company.phone}</p>}
              {company?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-500" /> {company.email}</p>}
            </div>
            <div className="mt-1 pt-3 border-t border-slate-200/30 w-full max-w-md">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                <Globe className="h-3.5 w-3.5" /> {company?.website || "WWW.EXTINPRO.PE"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
