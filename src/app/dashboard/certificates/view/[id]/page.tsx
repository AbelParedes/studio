
"use client"

import { use, useEffect, useState } from "react"
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
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Scale,
  Award
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Image from "next/image"

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

  if (isLoading) return <div className="p-20 text-center font-bold uppercase animate-pulse text-primary">Generando Protocolo...</div>
  if (!cert) return <div className="p-20 text-center font-bold uppercase">Folio no encontrado</div>

  const formattedDate = cert.fechaEmision ? format(parseISO(cert.fechaEmision), "dd 'de' MMMM 'del' yyyy", { locale: es }) : "---"
  const displayCertNumber = cert.certificadoNumero?.replace('CERT-', '') || "---"
  const qrValidationUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="font-black uppercase text-[10px] tracking-widest"><ArrowLeft className="mr-2 h-3 w-3" /> Regresar</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="font-black uppercase text-[10px] tracking-widest border-2"><Printer className="mr-2 h-3.5 w-3.5" /> Imprimir</Button>
          <Button size="sm" className="bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl px-6"><Download className="mr-2 h-3.5 w-3.5" /> PDF</Button>
        </div>
      </div>

      <div className="proforma-container bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl p-0 border print:shadow-none print:border-none print:m-0 print:w-full overflow-hidden flex flex-col relative text-[#1c1c1c]">
        
        {/* HEADER */}
        <div className="pt-12 px-12 pb-8 shrink-0 flex items-center justify-between bg-slate-50/50 border-b">
          <div className="relative h-20 w-64">
            {(company?.headerUrl || company?.logoUrl) ? (<Image src={company.headerUrl || company.logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />) : (<div className="h-full w-full bg-white border-2 border-dashed flex items-center justify-center"><ShieldCheck className="h-10 w-10 text-slate-300" /></div>)}
          </div>
          <div className="text-right">
            <h1 className="text-sm font-black text-primary uppercase tracking-tighter mb-1">CERTIFICADO DE OPERATIVIDAD</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">NTP 350.043-1</p>
            <div className="bg-[#1c1c1c] text-white px-6 py-2 rounded font-black text-xs tracking-widest inline-block border-b-2 border-slate-400">CERT N° {displayCertNumber}</div>
          </div>
        </div>

        <div className="p-12 space-y-10 flex-1 relative z-10">
          {/* MARCA DE AGUA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none -rotate-12">
            {company?.logoUrl ? (<div className="relative h-[500px] w-[500px]"><Image src={company.logoUrl} alt="Watermark" fill className="object-contain" unoptimized /></div>) : (<Award className="h-[500px] w-[500px]" />)}
          </div>

          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-4">
              <div className="flex items-center gap-4"><h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">EMPRESA</h3><div className="h-[1px] bg-slate-100 w-full"></div></div>
              <div className="space-y-1 pt-1"><p className="text-lg font-black uppercase">{cert.clienteNombre}</p><p className="text-[11px] font-bold text-slate-500 uppercase">{client?.address || "---"}</p><p className="text-[11px] font-bold text-slate-500">RUC: {client?.taxId || "---"}</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4"><h3 className="text-[10px] font-black text-slate-400 uppercase shrink-0">VALIDEZ TÉCNICA</h3><div className="h-[1px] bg-slate-100 w-full"></div></div>
              <div className="text-[11px] space-y-2 pt-1 text-right"><p className="font-bold uppercase">EMISIÓN: <span className="font-black">{formattedDate}</span></p><div className="bg-slate-50 border px-4 py-2 rounded inline-block"><p className="text-[12px] font-black uppercase text-primary">NORMA: {cert.normativa || "NTP 350.043"}</p></div></div>
            </div>
          </div>

          <div className="space-y-8 pt-4">
            <div className="flex items-center gap-3 bg-slate-50 border p-3 rounded"><Scale className="h-4 w-4 text-primary" /><h3 className="text-[10px] font-black uppercase tracking-[0.15em]">ANEXO TÉCNICO DE EQUIPOS</h3></div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-white border rounded-lg text-center"><p className="text-[8px] font-black text-slate-400 uppercase">P. PRUEBA</p><p className="text-xs font-black text-primary">{cert.presionPrueba}</p></div>
              <div className="p-3 bg-white border rounded-lg text-center"><p className="text-[8px] font-black text-slate-400 uppercase">P. TRABAJO</p><p className="text-xs font-black text-primary">{cert.presionTrabajo}</p></div>
              <div className="p-3 bg-white border rounded-lg text-center"><p className="text-[8px] font-black text-slate-400 uppercase">RATING</p><p className="text-xs font-black text-primary">{cert.rating}</p></div>
            </div>
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-[10px] border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b"><tr><th className="p-3 text-left font-black uppercase border-r">SERIE</th><th className="p-3 text-left font-black uppercase border-r">AGENTE / CAPACIDAD</th><th className="p-3 text-center font-black uppercase border-r">VTO. RECARGA</th><th className="p-3 text-center font-black uppercase">VTO. P.H.</th></tr></thead>
                <tbody>
                  {cert.datosExtintor?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-black text-primary border-r">{item.ns}</td>
                      <td className="p-3 font-bold uppercase border-r">{item.tipo} {item.cap}</td>
                      <td className="p-3 text-center font-bold text-slate-500 border-r">{item.vctoRecarga}</td>
                      <td className="p-3 text-center font-bold text-slate-500">{item.vctoPH || "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-16 grid grid-cols-2 gap-24 text-center">
            {/* FIRMA EMPRESA */}
            <div className="space-y-3 relative">
              <div className="h-24 w-full border-b-2 flex flex-col items-center justify-center bg-slate-50/30 rounded-t-lg relative">
                {company?.signatureUrl ? (
                  <div className="relative h-20 w-40 z-20">
                    <Image src={company.signatureUrl} alt="Firma Empresa" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <div className="border-4 border-primary/10 text-primary/10 p-2 rounded-xl rotate-12 font-black text-[11px] uppercase border-double absolute">VALIDADO POR<br/>INGENIERÍA TÉCNICA</div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{company?.name || "SERVIFUMIGA PRO"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">FIRMA Y SELLO AUTORIZADO</p>
            </div>

            {/* FIRMA TÉCNICO */}
            <div className="space-y-3 relative">
              <div className="h-24 w-full border-b-2 flex flex-col items-center justify-center bg-slate-50/30 rounded-t-lg relative">
                {technician?.signatureUrl ? (
                  <div className="relative h-20 w-40 z-20">
                    <Image src={technician.signatureUrl} alt="Firma Técnico" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <div className="text-2xl text-slate-300 italic opacity-50 font-medium">Firma Digital Técnico</div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase text-primary">{cert.technicianName}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">TÉCNICO ESPECIALISTA NTP</p>
            </div>
          </div>
        </div>

        <div className="mt-auto shrink-0 flex flex-col items-center justify-center py-8 print-footer" style={{ backgroundColor: company?.footerBgColor || '#f8fafc', borderTop: '1px solid #e2e8f0' } as any}>
          <div className="px-12 w-full flex flex-col items-center text-center gap-3 text-slate-600">
            <div className="flex flex-wrap justify-center gap-x-12 text-[10px] font-black uppercase">{company?.address && <p>{company.address}</p>}{company?.phone && <p>{company.phone}</p>}</div>
            <div className="mt-1 pt-3 border-t border-slate-200/50 w-full max-w-lg"><p className="text-[10px] font-black opacity-50 uppercase tracking-[0.4em] flex items-center justify-center gap-3"><Globe className="h-3.5 w-3.5" /> {company?.website || "WWW.SERVIFUMIGAPRO.PE"}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
