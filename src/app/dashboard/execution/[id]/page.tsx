
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  Camera, 
  PenTool, 
  Loader2, 
  FlaskConical,
  Award
} from "lucide-react"
import { useDoc, useFirestore, updateDocumentNonBlocking, useUser, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { addMonths, addYears, format } from "date-fns"

export default function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const [isSaving, setIsSaving] = useState(false)

  const aptRef = useMemoFirebase(() => doc(db, "appointments", id), [db, id])
  const { data: apt, isLoading } = useDoc(aptRef)

  const [techData, setTechData] = useState<any>({
    chemicalsUsed: "",
    dosage: "",
    pestTargeted: [],
    extChecklist: {
      presion_nominal: false,
      manguera_boquilla: false,
      pasador_seguridad: false,
      etiqueta_vigencia: false,
      estado_cilindro: false,
    },
    observations: "",
    clientSignatureName: "",
  })

  const handlePestToggle = (pest: string) => {
    const current = techData.pestTargeted
    const next = current.includes(pest) 
      ? current.filter((p: string) => p !== pest)
      : [...current, pest]
    setTechData({ ...techData, pestTargeted: next })
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Cálculo automático de próxima visita Pro
    const today = new Date()
    const isFumigation = apt?.serviceType === "Fumigación"
    const nextDue = isFumigation 
      ? format(addMonths(today, 6), "yyyy-MM-dd") 
      : format(addYears(today, 1), "yyyy-MM-dd")

    const executionReport = {
      ...techData,
      finishedAt: new Date().toISOString(),
      status: "Completado",
      nextDue: nextDue,
      certificateNumber: `CERT-${id.split('-')[0].toUpperCase()}`
    }

    try {
      updateDocumentNonBlocking(doc(db, "appointments", id), executionReport)
      toast({ title: "Servicio Finalizado", description: "El certificado técnico ha sido emitido y archivado." })
      router.push("/dashboard/certificates")
    } catch (err) {
      toast({ variant: "destructive", title: "Error al finalizar" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>
  if (!apt) return <div className="p-20 text-center uppercase font-black">Cita no encontrada</div>

  const isFumigation = apt.serviceType === "Fumigación"
  const isExtinguisher = apt.serviceType === "Extintores" || apt.serviceType === "Inspección Técnica"

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-primary">Control de Campo</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Orden: {apt.id.split('-')[0]} • {apt.clientName}</p>
        </div>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        {/* FUMIGACIÓN */}
        {isFumigation && (
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-primary">
                <FlaskConical className="h-4 w-4" /> Protocolo Sanitario (DIGESA)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Producto / I. Activo</Label>
                  <Input 
                    placeholder="Ej. Cypermetrina 20%" 
                    className="h-10 text-xs font-bold border-2"
                    value={techData.chemicalsUsed}
                    onChange={e => setTechData({...techData, chemicalsUsed: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Dosificación (cc/L)</Label>
                  <Input 
                    placeholder="Ej. 15cc por Litro" 
                    className="h-10 text-xs font-bold border-2"
                    value={techData.dosage}
                    onChange={e => setTechData({...techData, dosage: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-500">Objetivo Biológico</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Cucarachas", "Roedores", "Hormigas", "Pulgas", "Arácnidos", "Voladores"].map(pest => (
                    <div key={pest} className="flex items-center space-x-2 border-2 p-2 rounded-xl bg-slate-50/50">
                      <Checkbox 
                        id={pest} 
                        checked={techData.pestTargeted.includes(pest)} 
                        onCheckedChange={() => handlePestToggle(pest)} 
                      />
                      <Label htmlFor={pest} className="text-[10px] font-bold cursor-pointer uppercase">{pest}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* EXTINTORES */}
        {isExtinguisher && (
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-primary">
                <Award className="h-4 w-4" /> Inspección de Operatividad (NFPA)
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
                  <div key={item.id} className="flex items-center justify-between p-3 border-2 rounded-xl bg-white transition-colors hover:bg-slate-50">
                    <Label className="text-[10px] font-bold uppercase text-slate-700">{item.label}</Label>
                    <Checkbox 
                      checked={techData.extChecklist[item.id]} 
                      onCheckedChange={(val) => setTechData({
                        ...techData, 
                        extChecklist: { ...techData.extChecklist, [item.id]: !!val }
                      })} 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* REPORTE GENERAL */}
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reporte de Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Observaciones y Recomendaciones</Label>
              <Textarea 
                placeholder="Indique hallazgos críticos o sugerencias de seguridad..."
                className="min-h-[100px] text-xs font-bold border-2 leading-relaxed"
                value={techData.observations}
                onChange={e => setTechData({...techData, observations: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="h-16 border-dashed border-2 flex flex-col gap-1 hover:bg-slate-50">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-[8px] font-black uppercase">Evidencia Antes</span>
              </Button>
              <Button type="button" variant="outline" className="h-16 border-dashed border-2 flex flex-col gap-1 hover:bg-slate-50">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-[8px] font-black uppercase">Evidencia Después</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CONFORMIDAD */}
        <Card className="shadow-sm border-none bg-[#1c1c1c] text-white border-b-[6px] border-accent rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 tracking-widest text-accent">
              <PenTool className="h-4 w-4" /> Conformidad del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase opacity-60">Nombre de quien recibe</Label>
              <Input 
                placeholder="Nombre completo" 
                className="h-11 text-xs font-bold bg-white/10 border-none text-white placeholder:text-white/30"
                value={techData.clientSignatureName}
                onChange={e => setTechData({...techData, clientSignatureName: e.target.value})}
                required
              />
            </div>
            <div className="h-32 w-full border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center bg-white/5">
              <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Área de Firma Táctil</span>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={isSaving}
          className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl rounded-xl transition-transform active:scale-95"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />}
          Cerrar Servicio y Emitir Certificado
        </Button>
      </form>
    </div>
  )
}
