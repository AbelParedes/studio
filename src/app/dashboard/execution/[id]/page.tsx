
"use client"

import { useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  CheckCircle2, 
  Camera, 
  PenTool, 
  Loader2, 
  Award,
  HardDrive,
  Info,
  Hash
} from "lucide-react"
import { useDoc, useFirestore, updateDocumentNonBlocking, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { addYears, format } from "date-fns"
import { cn } from "@/lib/utils"

export default function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const [isSaving, setIsSaving] = useState(false)

  const aptRef = useMemoFirebase(() => doc(db, "appointments", id), [db, id])
  const { data: apt, isLoading } = useDoc(aptRef)

  const equipmentQuery = useMemoFirebase(() => 
    apt?.clientId ? query(collection(db, "client_equipment"), where("clientId", "==", apt.clientId)) : null,
  [db, apt?.clientId])
  const { data: equipment } = useCollection(equipmentQuery)

  const certsQuery = useMemoFirebase(() => 
    apt?.companyId ? query(collection(db, "appointments"), where("companyId", "==", apt.companyId), where("status", "==", "Completado")) : null,
  [db, apt?.companyId])
  const { data: certificates } = useCollection(certsQuery)

  const currentYear = new Date().getFullYear()
  const suggestedCertNumber = useMemo(() => {
    if (!certificates || certificates.length === 0) return `Cert_${currentYear}_001`
    const yearCerts = certificates.filter(c => (c.certificateNumber || "").startsWith(`Cert_${currentYear}_`))
    if (yearCerts.length === 0) return `Cert_${currentYear}_001`
    const numbers = yearCerts.map(c => {
      const parts = c.certificateNumber.split("_")
      return parts.length === 3 ? parseInt(parts[2]) : 0
    })
    const maxNum = Math.max(...numbers)
    return `Cert_${currentYear}_${(maxNum + 1).toString().padStart(3, '0')}`
  }, [certificates, currentYear])

  const [techData, setTechData] = useState<any>({
    extChecklist: {
      presion_nominal: false,
      manguera_boquilla: false,
      pasador_seguridad: false,
      etiqueta_vigencia: false,
      estado_cilindro: false,
    },
    servicedEquipmentIds: [], 
    observations: "",
    clientSignatureName: "",
    customCertNumber: ""
  })

  const handleEquipmentToggle = (equipId: string) => {
    const current = techData.servicedEquipmentIds
    const next = current.includes(equipId) ? current.filter((id: string) => id !== equipId) : [...current, equipId]
    setTechData({ ...techData, servicedEquipmentIds: next })
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const today = new Date()
    const nextDue = format(addYears(today, 1), "yyyy-MM-dd")
    const finalCertNumber = techData.customCertNumber || suggestedCertNumber

    const executionReport = {
      ...techData,
      finishedAt: new Date().toISOString(),
      status: "Completado",
      nextDue: nextDue,
      certificateNumber: finalCertNumber
    }

    try {
      updateDocumentNonBlocking(doc(db, "appointments", id), executionReport)
      if (techData.servicedEquipmentIds.length > 0) {
        techData.servicedEquipmentIds.forEach((equipId: string) => {
          updateDocumentNonBlocking(doc(db, "client_equipment", equipId), {
            lastServiceDate: format(today, "yyyy-MM-dd"),
            nextServiceDate: nextDue,
            status: "Operativo",
            updatedAt: new Date().toISOString()
          })
        })
      }
      toast({ title: "Servicio Finalizado", description: `Protocolo ${finalCertNumber} emitido.` })
      router.push("/dashboard/certificates")
    } catch (err) {
      toast({ variant: "destructive", title: "Error al finalizar" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div>
  if (!apt) return <div className="p-20 text-center uppercase font-black">Registro no encontrado</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-primary">Ejecución Técnica NTP</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OT: {apt.id.split('-')[0]} • {apt.clientName}</p>
        </div>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        <Card className="shadow-sm border-none bg-white">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-primary flex items-center gap-1.5 tracking-widest">
                <Hash className="h-3 w-3 text-accent" /> Folio de Protocolo Sugerido
              </Label>
              <Input 
                value={techData.customCertNumber || suggestedCertNumber} 
                onChange={e => setTechData({...techData, customCertNumber: e.target.value})}
                className="h-12 text-sm font-mono font-black border-2 bg-slate-50 border-primary/10 text-primary"
              />
            </div>
          </CardContent>
        </Card>

        {equipment && equipment.length > 0 && (
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-primary">
                <HardDrive className="h-4 w-4" /> Equipos Inspeccionados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {equipment.map(item => (
                  <div key={item.id} className={cn(
                    "flex items-center justify-between p-3 border-2 rounded-2xl transition-all cursor-pointer",
                    techData.servicedEquipmentIds.includes(item.id) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                  )} onClick={() => handleEquipmentToggle(item.id)}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={techData.servicedEquipmentIds.includes(item.id)} onCheckedChange={() => handleEquipmentToggle(item.id)} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase">{item.serialNumber}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.type} • {item.location}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-primary">
              <Award className="h-4 w-4" /> Inspección de Operatividad (NTP 350.043-1)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'presion_nominal', label: 'Manómetro en Zona Verde (Presión)' },
                { id: 'manguera_boquilla', label: 'Manguera sin Obstrucciones' },
                { id: 'pasador_seguridad', label: 'Pasador y Precinto de Plástico' },
                { id: 'etiqueta_vigencia', label: 'Etiqueta de Mantenimiento Visible' },
                { id: 'estado_cilindro', label: 'Cilindro sin Corrosión o Abolladura' },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 border-2 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
                  <Label className="text-[10px] font-bold uppercase text-slate-700">{item.label}</Label>
                  <Checkbox 
                    checked={techData.extChecklist[item.id]} 
                    onCheckedChange={(val) => setTechData({ ...techData, extChecklist: { ...techData.extChecklist, [item.id]: !!val } })} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Observaciones Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Textarea 
              placeholder="Indique hallazgos críticos según la norma NTP..."
              className="min-h-[120px] text-xs font-bold border-2 leading-relaxed rounded-2xl"
              value={techData.observations}
              onChange={e => setTechData({...techData, observations: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="h-20 border-dashed border-2 rounded-2xl flex flex-col gap-1 hover:bg-slate-50 hover:border-primary">
                <Camera className="h-6 w-6 text-muted-foreground" />
                <span className="text-[8px] font-black uppercase">Evidencia Fotográfica</span>
              </Button>
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2">
                <Info className="h-4 w-4 text-slate-300 mb-1" />
                <p className="text-[7px] font-bold uppercase text-slate-400 text-center">La evidencia digital es obligatoria para auditorías.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-none bg-[#1c1c1c] text-white border-b-[8px] border-accent rounded-[2.5rem]">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-accent">
              <PenTool className="h-4 w-4" /> Conformidad del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase opacity-60">Representante que autoriza</Label>
              <Input 
                placeholder="Nombre y Apellidos" 
                className="h-12 text-xs font-bold bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                value={techData.clientSignatureName}
                onChange={e => setTechData({...techData, clientSignatureName: e.target.value})}
                required
              />
            </div>
            <div className="h-32 w-full border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-white/5 cursor-pointer">
              <PenTool className="h-6 w-6 text-white/20 mb-2" />
              <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">Captura de Firma Digital</span>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={isSaving}
          className="w-full h-16 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl rounded-2xl transition-all active:scale-95"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />}
          Cerrar Orden y Emitir Certificado
        </Button>
      </form>
    </div>
  )
}
