
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
  Globe
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth, useCollection } from "@/firebase"
import { doc, setDoc, collection, query, where, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

type SettingsTab = "profile" | "company" | "notifications" | "security" | "data"

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
    phone: ""
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
        phone: company.phone || ""
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
      toast({ title: "Datos de empresa actualizados" })
    } catch {
      toast({ variant: "destructive", title: "Error al guardar datos de empresa" })
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
          <h2 className="text-2xl font-bold tracking-tight mb-1">AJUSTES Y PERSONALIZACIÓN</h2>
          <p className="text-muted-foreground text-sm">Administre su perfil personal y los datos de su organización.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-1 bg-white p-2 rounded-lg border">
            <Button variant="ghost" className={cn("justify-start font-bold", activeTab === "profile" && "bg-primary/5 text-primary")} onClick={() => setActiveTab("profile")}>
              <User className="mr-3 h-4 w-4" /> Perfil Personal
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold", activeTab === "company" && "bg-primary/5 text-primary")} onClick={() => setActiveTab("company")}>
              <Building2 className="mr-3 h-4 w-4" /> Mi Empresa
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold", activeTab === "notifications" && "bg-primary/5 text-primary")} onClick={() => setActiveTab("notifications")}>
              <Bell className="mr-3 h-4 w-4" /> Notificaciones
            </Button>
            <Button variant="ghost" className={cn("justify-start font-bold", activeTab === "security" && "bg-primary/5 text-primary")} onClick={() => setActiveTab("security")}>
              <Lock className="mr-3 h-4 w-4" /> Seguridad
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/5 font-bold" onClick={handleSignOut}>
              <LogOut className="mr-3 h-4 w-4" /> Cerrar Sesión
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Información Personal</CardTitle>
                <CardDescription>Datos del administrador de cuenta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formData.email} disabled className="bg-muted" />
                  </div>
                </div>
                <Button className="bg-primary text-white" onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Guardar Cambios
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Configuración de Empresa</CardTitle>
                <CardDescription>Personalice la apariencia y datos legales de su organización.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border rounded-lg bg-muted/20">
                  <div className="relative h-24 w-24 rounded border bg-white flex items-center justify-center overflow-hidden">
                    {companyData.logoUrl ? (
                      <Image src={companyData.logoUrl} alt="Logo" fill className="object-contain p-2" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>URL del Logo Corporativo</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://..." 
                        value={companyData.logoUrl} 
                        onChange={(e) => setCompanyData({...companyData, logoUrl: e.target.value})} 
                      />
                      <Button variant="outline" size="icon"><Globe className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Recomendado: Fondo transparente (PNG) 200x200px.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Comercial</Label>
                    <Input value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>RUC / DNI Corporativo</Label>
                    <Input value={companyData.taxId} onChange={(e) => setCompanyData({...companyData, taxId: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={companyData.phone} onChange={(e) => setCompanyData({...companyData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección Fiscal</Label>
                    <Input value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} />
                  </div>
                </div>
                <Button className="bg-primary text-white" onClick={handleUpdateCompany} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Actualizar Datos de Empresa
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Notificaciones</CardTitle>
                <CardDescription>Alertas del sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 border rounded">
                  <div className="space-y-0.5">
                    <Label>Alertas de Vencimiento</Label>
                    <p className="text-xs text-muted-foreground italic">Notificar 30 días antes de caducidad.</p>
                  </div>
                  <Switch checked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Seguridad</CardTitle>
                <CardDescription>Protección de cuenta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-status-success/5 border border-status-success/20 rounded flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-status-success" />
                  <span className="text-xs font-bold text-status-success uppercase">Estado de Seguridad Óptimo</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
