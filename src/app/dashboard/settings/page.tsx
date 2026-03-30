"use client"

import { useState, useEffect, useMemo } from "react"
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
  Palette,
  ImageIcon,
  Save,
  Paintbrush,
  Zap,
  CreditCard,
  PenTool,
  CheckCircle2
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
  const [formData, setFormData] = useState({ name: "", email: "", signatureUrl: "" })
  const [companyData, setCompanyData] = useState({
    name: "",
    taxId: "",
    address: "",
    logoUrl: "",
    headerUrl: "",
    footerUrl: "",
    signatureUrl: "",
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

  const rolesRef = useMemoFirebase(() => collection(db, "system_roles"), [db])
  const { data: roles } = useCollection(rolesRef)

  const isTechnicalUser = useMemo(() => {
    if (!profile || !roles) return false;
    const userRole = roles.find(r => r.id === profile.roleId);
    if (!userRole) return false;
    const title = userRole.title.toLowerCase();
    return title.includes("técnico") || title.includes("campo") || userRole.permissions?.field_operations === true;
  }, [profile, roles]);

  useEffect(() => {
    if (profile) {
      setFormData({ 
        name: profile.name || "", 
        email: profile.email || user?.email || "",
        signatureUrl: profile.signatureUrl || ""
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
        signatureUrl: company.signatureUrl || "",
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
        toast({ variant: "destructive", title: "Error", description: "No tienes una organización vinculada." })
        return
      }

      await setDoc(doc(db, "companies", targetCompanyId), { 
        ...companyData,
        id: targetCompanyId,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      toast({ 
        title: "Organización Actualizada", 
        description: "Los recursos corporativos de EXTINPRO se han guardado." 
      })
    } catch (error) {
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
        <p className="text-xs font-bold uppercase text-muted-foreground">Sincronizando ajustes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Ajustes del Sistema</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Personalización de identidad y recursos técnicos de EXTINPRO.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-1 bg-white p-2 rounded-lg border shadow-sm sticky top-6">
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "profile" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("profile")}>
              <User className="mr-3 h-4 w-4" /> Mi Perfil
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "company" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("company")}>
              <Palette className="mr-3 h-4 w-4" /> Branding Empresa
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
              <LogOut className="mr-3 h-4 w-4" /> Cerrar Sesión
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Información Personal</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Gestione sus datos de contacto en la suite técnica.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-11 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Email</Label>
                    <Input value={formData.email} disabled className="bg-muted h-11 font-bold text-xs" />
                  </div>
                </div>

                {isTechnicalUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                      <PenTool className="h-3 w-3" /> Firma Digital del Especialista (Campo)
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-slate-50 border-dashed">
                      <div className="relative h-20 w-40 rounded border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                        {formData.signatureUrl ? (
                          <Image src={formData.signatureUrl} alt="Firma Técnico" fill className="object-contain p-2" unoptimized />
                        ) : (
                          <span className="text-[8px] uppercase font-bold text-slate-300">Sin Firma Cargada</span>
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-3">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">URL de Imagen de Firma</Label>
                        <Input 
                          placeholder="https://ejemplo.com/firma-tecnico.png" 
                          value={formData.signatureUrl} 
                          onChange={(e) => setFormData({...formData, signatureUrl: e.target.value})} 
                          className="h-11 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed flex items-center gap-4">
                    <ShieldCheck className="h-6 w-6 text-slate-300" />
                    <p className="text-[10px] font-bold uppercase text-slate-400 italic">
                      Su perfil actual es administrativo. Las firmas digitales personales están reservadas exclusivamente para especialistas de campo que emiten certificados NTP.
                    </p>
                  </div>
                )}

                <Button className="bg-primary text-white font-black uppercase text-[11px] h-10 shadow-lg px-8" onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-3 w-3" />} Guardar Mi Perfil
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Identidad Corporativa y Firma Autorizada</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Configure los elementos visuales y el sello oficial de EXTINPRO para sus documentos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                    <PenTool className="h-3 w-3" /> Firma y Sello de Gerencia (Empresa)
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-xl bg-slate-50 border-dashed">
                    <div className="relative h-24 w-48 rounded border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                      {companyData.signatureUrl ? (
                        <Image src={companyData.signatureUrl} alt="Sello Empresa" fill className="object-contain p-2" unoptimized />
                      ) : (
                        <span className="text-[8px] uppercase font-bold text-slate-300">Sin Sello de Gerencia</span>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">URL del Sello Autorizado</Label>
                      <Input 
                        placeholder="https://ejemplo.com/sello-gerencia.png" 
                        value={companyData.signatureUrl} 
                        onChange={(e) => setCompanyData({...companyData, signatureUrl: e.target.value})} 
                        className="h-11 font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Color Primario</Label>
                    <div className="flex gap-2">
                      <Input type="color" className="w-12 h-10 p-1" value={companyData.primaryColor} onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} />
                      <Input value={companyData.primaryColor} onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} className="font-mono text-xs font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Color Acento</Label>
                    <Input type="color" className="w-full h-10 p-1" value={companyData.accentColor} onChange={(e) => setCompanyData({...companyData, accentColor: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Fondo Documentos</Label>
                    <Input type="color" className="w-full h-10 p-1" value={companyData.footerBgColor} onChange={(e) => setCompanyData({...companyData, footerBgColor: e.target.value})} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-primary">Logotipo del Sistema</Label>
                    <div className="relative h-20 w-full border rounded bg-white flex items-center justify-center overflow-hidden">
                      {companyData.logoUrl ? <Image src={companyData.logoUrl} alt="Logo" fill className="object-contain p-2" unoptimized /> : <span className="text-[8px] font-bold opacity-30 uppercase">Sin Logo</span>}
                    </div>
                    <Input placeholder="URL del Logotipo" value={companyData.logoUrl} onChange={(e) => setCompanyData({...companyData, logoUrl: e.target.value})} className="h-9 text-[10px] font-bold" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-primary">Cabecera de Protocolos</Label>
                    <div className="relative h-20 w-full border rounded bg-white flex items-center justify-center overflow-hidden">
                      {companyData.headerUrl ? <Image src={companyData.headerUrl} alt="Header" fill className="object-contain" unoptimized /> : <span className="text-[8px] font-bold opacity-30 uppercase">Sin Cabecera</span>}
                    </div>
                    <Input placeholder="URL de Cabecera" value={companyData.headerUrl} onChange={(e) => setCompanyData({...companyData, headerUrl: e.target.value})} className="h-9 text-[10px] font-bold" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t flex justify-end p-6">
                <Button className="bg-primary text-white font-black uppercase text-[11px] h-11 px-8 shadow-lg" onClick={handleUpdateCompany} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} 
                  Guardar Cambios Corporativos
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "subscription" && (
            <Card className="shadow-sm border-none overflow-hidden">
              <CardHeader className="bg-primary text-white pb-8">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" /> Estado de Suscripción EXTINPRO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-primary/10 rounded-2xl bg-slate-50 gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Plan Actual Activo</p>
                    <h3 className="text-3xl font-black text-primary uppercase">{company?.plan || "Básico"}</h3>
                  </div>
                  <Link href="/dashboard/plans">
                    <Button className="bg-accent text-white font-black uppercase text-[10px] h-10 shadow-lg px-8">Upgrade</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
