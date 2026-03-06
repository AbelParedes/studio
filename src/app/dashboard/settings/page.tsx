
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
  Database, 
  Loader2, 
  Save, 
  LogOut, 
  ShieldCheck, 
  Building2,
  Mail,
  Smartphone,
  Globe,
  Palette,
  Moon,
  Sun
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
    phone: "",
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
      setFormData({ name: profile.name || "", email: profile.email || user?.email || "" })
    }
    if (company) {
      setCompanyData({
        name: company.name || "",
        taxId: company.taxId || "",
        address: company.address || "",
        logoUrl: company.logoUrl || "",
        phone: company.phone || "",
        primaryColor: company.primaryColor || "#1a2b3c",
        accentColor: company.accentColor || "#d9534f",
        themeMode: (company.themeMode as "light" | "dark") || "light"
      })
    }
  }, [profile, company, user])

  const handleUpdateProfile = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "company_users", profile.id), { ...formData }, { merge: true })
      toast({ title: "Perfil actualizado" })
    } catch {
      toast({ variant: "destructive", title: "Error al actualizar" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCompany = async () => {
    if (!profile?.companyId) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "companies", profile.companyId), { ...companyData }, { merge: true })
      toast({ title: "Configuración de empresa guardada", description: "Los cambios se aplicarán al recargar." })
    } catch {
      toast({ variant: "destructive", title: "Error al guardar configuración" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  if (loadingProfile || loadingCompany) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase text-muted-foreground">Cargando ajustes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">AJUSTES SAAS</h2>
          <p className="text-muted-foreground text-sm">Personalice la marca y experiencia de su organización.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-1 bg-white dark:bg-slate-900 p-2 rounded-lg border shadow-sm">
            <Button variant="ghost" className={cn("justify-start font-bold uppercase text-[11px]", activeTab === "profile" && "bg-primary/5 text-primary border-l-4 border-primary rounded-none")} onClick={() => setActiveTab("profile")}>
              <User className="mr-3 h-4 w-4" /> Perfil Personal
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
              <LogOut className="mr-3 h-4 w-4" /> Cerrar Sesión
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Información del Administrador</CardTitle>
                <CardDescription>Datos básicos del perfil de usuario.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Correo Institucional</Label>
                    <Input value={formData.email} disabled className="bg-muted" />
                  </div>
                </div>
                <Button className="bg-primary text-white font-bold uppercase text-[11px]" onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Guardar Mi Perfil
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Identidad Visual y SaaS</CardTitle>
                  <CardDescription>Configure como sus clientes y técnicos ven la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border rounded-lg bg-muted/20 border-dashed">
                    <div className="relative h-24 w-24 rounded border bg-white flex items-center justify-center overflow-hidden shadow-inner">
                      {companyData.logoUrl ? (
                        <Image src={companyData.logoUrl} alt="Logo" fill className="object-contain p-2" />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs font-bold uppercase">URL Logotipo (PNG/SVG preferible)</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://su-dominio.com/logo.png" 
                          value={companyData.logoUrl} 
                          onChange={(e) => setCompanyData({...companyData, logoUrl: e.target.value})} 
                        />
                        <Button variant="outline" size="icon"><Globe className="h-4 w-4" /></Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Este logo aparecerá en el menú lateral y reportes.</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center">
                        <Palette className="h-3 w-3 mr-2" /> Colores Corporativos
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">Color Primario</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={companyData.primaryColor} className="w-12 h-10 p-1" onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} />
                            <Input value={companyData.primaryColor} className="font-mono text-xs" onChange={(e) => setCompanyData({...companyData, primaryColor: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">Color Acento</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={companyData.accentColor} className="w-12 h-10 p-1" onChange={(e) => setCompanyData({...companyData, accentColor: e.target.value})} />
                            <Input value={companyData.accentColor} className="font-mono text-xs" onChange={(e) => setCompanyData({...companyData, accentColor: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center">
                        <Moon className="h-3 w-3 mr-2" /> Preferencia de Tema
                      </h4>
                      <div className="flex items-center justify-between p-3 border rounded bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center gap-3">
                          {companyData.themeMode === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                          <span className="text-xs font-bold uppercase">{companyData.themeMode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                        </div>
                        <Switch 
                          checked={companyData.themeMode === 'dark'} 
                          onCheckedChange={(checked) => setCompanyData({...companyData, themeMode: checked ? 'dark' : 'light'})} 
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase">Nombre Comercial / Empresa</Label>
                      <Input value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase">RUC / Registro Tributario</Label>
                      <Input value={companyData.taxId} onChange={(e) => setCompanyData({...companyData, taxId: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase">Central Telefónica</Label>
                      <Input value={companyData.phone} onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase">Dirección Fiscal / Sede Central</Label>
                      <Input value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t mt-4 flex justify-end p-4">
                  <Button className="bg-primary text-white font-bold uppercase text-[11px]" onClick={handleUpdateCompany} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Guardar Configuración SaaS
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Alertas y Notificaciones</CardTitle>
                <CardDescription>Configure canales de comunicación para el personal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded bg-white dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold uppercase">Alertas de Vencimiento de Equipos</Label>
                    <p className="text-[10px] text-muted-foreground italic uppercase">Notificar 30 días antes de caducidad vía dashboard.</p>
                  </div>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded bg-white dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold uppercase">Notificaciones de Nuevas Citas</Label>
                    <p className="text-[10px] text-muted-foreground italic uppercase">Avisar a técnicos cuando se asigne una ruta.</p>
                  </div>
                  <Switch checked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Seguridad de la Organización</CardTitle>
                <CardDescription>Protocolos de acceso y auditoría.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-status-success/5 border border-status-success/20 rounded flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-status-success" />
                  <div>
                    <span className="text-xs font-bold text-status-success uppercase block">Certificación de Seguridad Activa</span>
                    <span className="text-[10px] opacity-70">Todos los accesos están protegidos por SSL y encriptación Firebase.</span>
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
