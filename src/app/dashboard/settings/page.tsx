
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Bell, 
  Lock, 
  Loader2, 
  LogOut, 
  ShieldCheck, 
  Building2,
  Globe,
  Palette,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
  Info,
  Image as ImageIcon,
  Save
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, useCollection } from "@/firebase"
import { doc, setDoc, collection, query, where, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

type SettingsTab = "profile" | "company" | "notifications" | "security"

export default function SettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ name: "", email: "" })
  const [companyData, setCompanyData] = useState({
    name: "",
    taxId: "",
    address: "",
    logoUrl: "",
    headerUrl: "",
    footerUrl: "",
    phone: "",
    email: "",
    primaryColor: "#1a2b3c",
    accentColor: "#d9534f",
    themeMode: "light" as "light" | "dark"
  })

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0] || null

  const companyRef = useMemoFirebase(() => 
    profile?.companyId ? doc(db, "companies", profile.companyId) : null,
  [db, profile?.companyId])
  const { data: company, isLoading: loadingCompany } = useDoc(companyRef)

  useEffect(() => {
    if (profile) {
      setFormData({ 
        name: profile.name || "", 
        email: profile.email || user?.email || "" 
      })
    }
    
    if (company) {
      setCompanyData({
        name: company.name || "",
        taxId: company.taxId || "",
        address: company.address || "",
        logoUrl: company.logoUrl || "",
        headerUrl: company.headerUrl || "",
        footerUrl: company.footerUrl || "",
        phone: company.phone || "",
        email: company.email || "",
        primaryColor: company.primaryColor || "#1a2b3c",
        accentColor: company.accentColor || "#d9534f",
        themeMode: (company.themeMode as "light" | "dark") || "light"
      })
    }
  }, [profile, company, user])

  const handleUpdateProfile = async () => {
    setIsSaving(true)
    try {
      const profileId = profile?.id || crypto.randomUUID()
      await setDoc(doc(db, "company_users", profileId), { 
        ...formData, 
        id: profileId,
        email: user?.email,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      toast({ title: "Perfil actualizado" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el perfil." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCompany = async () => {
    setIsSaving(true)
    try {
      let targetCompanyId = profile?.companyId

      if (!targetCompanyId) {
        toast({ variant: "destructive", title: "Error", description: "No tienes una empresa vinculada." })
        return
      }

      await setDoc(doc(db, "companies", targetCompanyId), { 
        ...companyData,
        id: targetCompanyId,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      toast({ 
        title: "Organización Actualizada", 
        description: "Los recursos gráficos y datos corporativos se han guardado." 
      })
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error de Guardado", description: "No se pudo actualizar la información." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  if (loadingProfile || (profile && loadingCompany)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase text-muted-foreground">Sincronizando ajustes corporativos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase">Ajustes del Sistema</h2>
          <p className="text-muted-foreground text-sm">Configure su perfil y la identidad visual de su organización.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-1 bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm sticky top-6">
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "profile" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("profile")}>
              <User className="mr-3 h-4 w-4" /> Mi Perfil
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "company" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("company")}>
              <Palette className="mr-3 h-4 w-4" /> Personalización Marca
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "notifications" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("notifications")}>
              <Bell className="mr-3 h-4 w-4" /> Notificaciones
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "security" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("security")}>
              <Lock className="mr-3 h-4 w-4" /> Seguridad
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/5 font-bold uppercase text-[11px]" onClick={handleSignOut}>
              <LogOut className="mr-3 h-4 w-4" /> Salir del Sistema
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Información Personal</CardTitle>
                <CardDescription>Datos básicos del administrador en sesión.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Email Institucional</Label>
                    <Input value={formData.email} disabled className="bg-muted" />
                  </div>
                </div>
                <Button className="bg-primary text-white font-bold uppercase text-[11px]" onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />} Guardar Mi Perfil
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Identidad Visual y Membretes</CardTitle>
                  <CardDescription>Configure los elementos gráficos que aparecerán en sus documentos oficiales (Cotizaciones, Certificados, etc).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* LOGOTIPO */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                      <ImageIcon className="h-3 w-3" /> Logotipo Principal del Sistema
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-slate-50 border-dashed">
                      <div className="relative h-24 w-24 rounded-lg border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                        {companyData.logoUrl ? (
                          <Image src={companyData.logoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground opacity-30" />
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-3">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">URL del Logotipo</Label>
                        <Input 
                          placeholder="https://ejemplo.com/mi-logo.png" 
                          value={companyData.logoUrl} 
                          onChange={(e) => setCompanyData({...companyData, logoUrl: e.target.value})} 
                        />
                        <p className="text-[9px] text-muted-foreground font-medium">Este logo aparecerá en el menú lateral y como respaldo en documentos.</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* RECURSOS PARA DOCUMENTOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <ImageIcon className="h-3 w-3" /> Cabecera Corporativa (Documentos)
                      </div>
                      <div className="space-y-3">
                        <div className="relative h-28 w-full border rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-inner">
                          {companyData.headerUrl ? (
                            <Image src={companyData.headerUrl} alt="Header Preview" fill className="object-contain" unoptimized />
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Vista previa cabecera membrete</span>
                          )}
                        </div>
                        <Input 
                          placeholder="URL de la Cabecera (800x200px recomendado)" 
                          value={companyData.headerUrl} 
                          onChange={(e) => setCompanyData({...companyData, headerUrl: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <ImageIcon className="h-3 w-3" /> Pie de Página Corporativo
                      </div>
                      <div className="space-y-3">
                        <div className="relative h-28 w-full border rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-inner">
                          {companyData.footerUrl ? (
                            <Image src={companyData.footerUrl} alt="Footer Preview" fill className="object-contain" unoptimized />
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Vista previa pie de página</span>
                          )}
                        </div>
                        <Input 
                          placeholder="URL del Pie de Página (800x150px recomendado)" 
                          value={companyData.footerUrl} 
                          onChange={(e) => setCompanyData({...companyData, footerUrl: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre de la Organización</Label>
                      <Input value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">RUC / Identificación Fiscal</Label>
                      <Input value={companyData.taxId} onChange={(e) => setCompanyData({...companyData, taxId: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Central Telefónica</Label>
                      <Input value={companyData.phone} onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Dirección Fiscal / Sede</Label>
                      <Input value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t flex justify-end p-6">
                  <Button className="bg-primary text-white font-black uppercase text-[11px] h-11 px-8 shadow-lg" onClick={handleUpdateCompany} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} 
                    Guardar Matriz de Branding
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Alertas y Notificaciones</CardTitle>
                <CardDescription>Configure cómo desea recibir las alertas de vencimiento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase">Recordatorios de Mantenimiento</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Aviso automático 30 días antes del vencimiento de extintores.</p>
                  </div>
                  <Switch checked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Seguridad del Entorno</CardTitle>
                <CardDescription>Protocolos de acceso y cifrado de datos SaaS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <div>
                    <span className="text-xs font-black text-primary uppercase block mb-1">Cifrado de Alta Seguridad SSL</span>
                    <span className="text-[11px] text-muted-foreground font-medium leading-tight block">Sus bases de datos de clientes, inventario y documentos están aislados y encriptados en nuestro silo de datos industrial.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
