
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
  ImageIcon,
  Save,
  Paintbrush,
  Zap,
  CreditCard
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth, useCollection } from "@/firebase"
import { doc, setDoc, collection, query, where, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

type SettingsTab = "profile" | "company" | "notifications" | "security" | "subscription"

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
    website: "",
    primaryColor: "#1a2b3c",
    accentColor: "#d9534f",
    footerBgColor: "#FFD700",
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
        website: company.website || "",
        primaryColor: company.primaryColor || "#1a2b3c",
        accentColor: company.accentColor || "#d9534f",
        footerBgColor: company.footerBgColor || "#FFD700",
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
        description: "Los recursos gráficos y colores corporativos se han guardado." 
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
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight text-[10px]">Configure su perfil y la identidad visual de su organización.</p>
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
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "subscription" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("subscription")}>
              <CreditCard className="mr-3 h-4 w-4" /> Suscripción
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
                <CardDescription className="text-[10px] font-bold uppercase">Datos básicos del administrador en sesión.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Email Institucional</Label>
                    <Input value={formData.email} disabled className="bg-muted h-11 font-bold text-xs" />
                  </div>
                </div>
                <Button className="bg-primary text-white font-black uppercase text-[11px] h-10 shadow-lg px-8" onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />} Guardar Mi Perfil
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Identidad Visual y Colores</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase">Configure los elementos gráficos y la paleta de colores oficial de su organización.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* COLORES CORPORATIVOS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                      <Paintbrush className="h-3 w-3" /> Paleta de Colores de Documentos
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Color Principal</Label>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 h-10 p-1" value={companyData.primaryColor} onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} />
                          <Input value={companyData.primaryColor} onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} className="font-mono text-xs font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Color de Acento</Label>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 h-10 p-1" value={companyData.accentColor} onChange={(e) => setCompanyData({...companyData, accentColor: e.target.value})} />
                          <Input value={companyData.accentColor} onChange={(e) => setCompanyData({...companyData, accentColor: e.target.value})} className="font-mono text-xs font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Fondo Pie de Página</Label>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 h-10 p-1" value={companyData.footerBgColor} onChange={(e) => setCompanyData({...companyData, footerBgColor: e.target.value})} />
                          <Input value={companyData.footerBgColor} onChange={(e) => setCompanyData({...companyData, footerBgColor: e.target.value})} className="font-mono text-xs font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

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
                          className="h-11 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* RECURSOS PARA DOCUMENTOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <ImageIcon className="h-3 w-3" /> Cabecera Corporativa (Membrete)
                      </div>
                      <div className="space-y-3">
                        <div className="relative h-28 w-full border rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-inner">
                          {companyData.headerUrl ? (
                            <Image src={companyData.headerUrl} alt="Header Preview" fill className="object-contain" unoptimized />
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Vista previa cabecera</span>
                          )}
                        </div>
                        <Input 
                          placeholder="URL de la Cabecera" 
                          value={companyData.headerUrl} 
                          onChange={(e) => setCompanyData({...companyData, headerUrl: e.target.value})} 
                          className="h-11 font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <ImageIcon className="h-3 w-3" /> Pie de Página (Membrete)
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
                          placeholder="URL del Pie de Página" 
                          value={companyData.footerUrl} 
                          onChange={(e) => setCompanyData({...companyData, footerUrl: e.target.value})} 
                          className="h-11 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre de la Organización</Label>
                      <Input value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} className="h-11 font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">RUC / Identificación Fiscal</Label>
                      <Input value={companyData.taxId} onChange={(e) => setCompanyData({...companyData, taxId: e.target.value})} className="h-11 font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Central Telefónica</Label>
                      <Input value={companyData.phone} onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} className="h-11 font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Email de Contacto</Label>
                      <Input value={companyData.email} onChange={(e) => setCompanyData({...companyData, email: e.target.value})} className="h-11 font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Sitio Web</Label>
                      <Input placeholder="www.tuempresa.com" value={companyData.website} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} className="h-11 font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Dirección Fiscal / Sede</Label>
                      <Input value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} className="h-11 font-bold text-xs" />
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

          {activeTab === "subscription" && (
            <Card className="shadow-sm border-none overflow-hidden">
              <CardHeader className="bg-primary text-white pb-8">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" /> Estado de Suscripción SaaS
                </CardTitle>
                <CardDescription className="text-white/70 text-[10px] font-bold uppercase">Gestione su plan y facturación recurrente.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-primary/10 rounded-2xl bg-slate-50 gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Plan Actual Activo</p>
                    <h3 className="text-3xl font-black text-primary uppercase">{company?.plan || "Básico"}</h3>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Link href="/dashboard/plans" className="w-full">
                      <Button className="w-full bg-accent text-white font-black uppercase text-[10px] h-10 shadow-lg px-8">
                        Mejorar Plan (Upgrade)
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full font-bold uppercase text-[10px] h-10">Ver Facturas</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-status-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-status-success" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Próximo Cobro</p>
                      <p className="text-sm font-bold">15 de Marzo, 2024</p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Ciclo de Facturación</p>
                      <p className="text-sm font-bold uppercase">Mensual</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Alertas y Notificaciones</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Configure cómo desea recibir las alertas de vencimiento.</CardDescription>
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
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Seguridad del Entorno</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Protocolos de acceso y cifrado de datos SaaS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <div>
                    <span className="text-xs font-black text-primary uppercase block mb-1">Cifrado de Alta Seguridad SSL</span>
                    <span className="text-[11px] text-muted-foreground font-bold uppercase leading-tight block">Sus bases de datos de clientes, inventario y documentos están aislados y encriptados en nuestro silo de datos industrial.</span>
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
