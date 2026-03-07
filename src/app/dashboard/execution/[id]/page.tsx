
"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Camera, 
  PenTool, 
  Loader2, 
  FlaskConical,
  Bug,
  Thermometer,
  Wrench,
  Save
} from "lucide-react"
import { useDoc, useFirestore, updateDocumentNonBlocking, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function ExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)

  const aptRef = useMemoFirebase(() => doc(db, "appointments", id), [db, id])
  const { data: apt, isLoading } = useDoc(aptRef)

  const [techData, setTechData] = useState<any>({
    chemicalsUsed: "",
    dosage: "",
    pestTargeted: [],
    extChecklist: {
      pressure: false,
      hose: false,
      pin: false,
      label: false,
      weight: false,
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
    
    const executionReport = {
      ...techData,
      finishedAt: new Date().toISOString(),
      status: "Completado"
    }

    try {
      updateDocumentNonBlocking(doc(db, "appointments", id), executionReport)
      toast({ title: "Servicio Finalizado", description: "El reporte técnico ha sido guardado y el certificado generado." })
      router.push("/dashboard/calendar")
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
          <h2 className="text-xl font-black uppercase tracking-tight">Ejecución de Servicio</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Cliente: {apt.clientName}</p>
        </div>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        {/* SECCIÓN 1: DETALLES TÉCNICOS ESPECÍFICOS */}
        {isFumigation && (
          <Card className="shadow-sm border-none">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" /> Control de Plagas (DIGESA)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Químico / Insecticida</Label>
                  <Input 
                    placeholder="Ej. Deltametrina 2.5%" 
                    className="h-10 text-xs font-bold"
                    value={techData.chemicalsUsed}
                    onChange={e => setTechData({...techData, chemicalsUsed: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Dosificación (ml/L)</Label>
                  <Input 
                    placeholder="Ej. 10ml por 1L de agua" 
                    className="h-10 text-xs font-bold"
                    value={techData.dosage}
                    onChange={e => setTechData({...techData, dosage: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase">Plagas a Controlar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Cucarachas", "Roedores", "Hormigas", "Pulgas", "Moscas", "Arácnidos"].map(pest => (
                    <div key={pest} className="flex items-center space-x-2 border p-2 rounded-lg bg-white">
                      <Checkbox 
                        id={pest} 
                        checked={techData.pestTargeted.includes(pest)} 
                        onCheckedChange={() => handlePestToggle(pest)} 
                      />
                      <Label htmlFor={pest} className="text-[11px] font-bold cursor-pointer uppercase">{pest}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isExtinguisher && (
          <Card className="shadow-sm border-none">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" /> Inspección de Seguridad (NFPA)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'pressure', label: 'Manómetro / Presión Correcta' },
                  { id: 'hose', label: 'Manguera y Boquilla Limpias' },
                  { id: 'pin', label: 'Pasador y Precinto de Seguridad' },
                  { id: 'label', label: 'Etiqueta de Vigencia Visible' },
                  { id: 'weight', label: 'Peso del Agente Verificado' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-white">
                    <Label className="text-[11px] font-bold uppercase">{item.label}</Label>
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

        {/* SECCIÓN 2: EVIDENCIA Y OBSERVACIONES */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase">Reporte de Campo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Observaciones Técnicas</Label>
              <Textarea 
                placeholder="Escriba hallazgos o recomendaciones para el cliente..."
                className="min-h-[100px] text-xs font-bold"
                value={techData.observations}
                onChange={e => setTechData({...techData, observations: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="h-16 border-dashed border-2 flex flex-col gap-1">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-[9px] font-black uppercase">Foto Antes</span>
              </Button>
              <Button type="button" variant="outline" className="h-16 border-dashed border-2 flex flex-col gap-1">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-[9px] font-black uppercase">Foto Después</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 3: CONFORMIDAD DEL CLIENTE */}
        <Card className="shadow-sm border-none bg-accent/5 border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
              <PenTool className="h-4 w-4 text-accent" /> Firma de Conformidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Nombre de quien recibe</Label>
              <Input 
                placeholder="Nombre completo del cliente" 
                className="h-10 text-xs font-bold bg-white"
                value={techData.clientSignatureName}
                onChange={e => setTechData({...techData, clientSignatureName: e.target.value})}
                required
              />
            </div>
            <div className="h-32 w-full border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-white">
              <span className="text-[9px] font-black uppercase text-slate-400">Área de Firma Táctil</span>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={isSaving}
          className="w-full h-14 bg-[#1c1c1c] text-white font-black uppercase text-xs tracking-widest shadow-xl border-b-4 border-accent"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5 text-accent" />}
          Finalizar y Generar Certificado
        </Button>
      </form>
    </div>
  )
}
