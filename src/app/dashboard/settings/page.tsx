"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  User, 
  Bell, 
  Lock, 
  Database, 
  Loader2, 
  Save, 
  LogOut, 
  ShieldCheck, 
  Download, 
  Trash2,
  Mail,
  Smartphone
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type SettingsTab = "profile" | "notifications" | "security" | "data"

export default function SettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Coordinador de Operaciones"
  })

  // Perfil del usuario en Firestore
  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, "company_users", user.uid) : null, 
  [db, user])
  
  const { data: profile, isLoading } = useDoc(userProfileRef)

  // Sincronizar estado local con datos de Firestore
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        role: profile.role || "Coordinador de Operaciones"
      })
    } else if (user && !isLoading) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || ""
      }))
    }
  }, [profile, user, isLoading])

  const handleUpdateProfile = () => {
    if (!userProfileRef) return
    setDoc(userProfileRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true })
      .then(() => {
        toast({ title: "Perfil actualizado", description: "Tus cambios se han guardado correctamente." })
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el perfil." })
      })
  }

  const handleTogglePreference = (key: string, value: boolean) => {
    if (!userProfileRef) return
    updateDocumentNonBlocking(userProfileRef, {
      [`preferences.${key}`]: value
    })
    toast({ title: "Preferencias actualizadas" })
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">AJUSTES DEL SISTEMA</h2>
          <p className="text-muted-foreground text-sm">Configure sus preferencias de usuario y parámetros generales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Ajustes */}
        <div className="lg:col-span-1 space-y-2">
          <nav className="flex flex-col space-y-1">
            <Button 
              variant="ghost" 
              className={cn("justify-start font-bold h-10", activeTab === "profile" && "bg-accent/10 text-accent")}
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-3 h-4 w-4" /> Perfil de Usuario
            </Button>
            <Button 
              variant="ghost" 
              className={cn("justify-start font-bold h-10", activeTab === "notifications" && "bg-accent/10 text-accent")}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="mr-3 h-4 w-4" /> Notificaciones
            </Button>
            <Button 
              variant="ghost" 
              className={cn("justify-start font-bold h-10", activeTab === "security" && "bg-accent/10 text-accent")}
              onClick={() => setActiveTab("security")}
            >
              <Lock className="mr-3 h-4 w-4" /> Seguridad
            </Button>
            <Button 
              variant="ghost" 
              className={cn("justify-start font-bold h-10", activeTab === "data" && "bg-accent/10 text-accent")}
              onClick={() => setActiveTab("data")}
            >
              <Database className="mr-3 h-4 w-4" /> Datos y Respaldo
            </Button>
            <Separator className="my-2" />
            <Button 
              variant="ghost" 
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive h-10 font-bold"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" /> Cerrar Sesión
            </Button>
          </nav>
        </div>

        {/* Contenido de Ajustes */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <>
              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Información Personal</CardTitle>
                  <CardDescription>Actualice sus datos de contacto y cargo administrativo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email de Contacto</Label>
                      <Input 
                        id="email" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo / Rol</Label>
                    <Input id="role" value={formData.role} disabled className="bg-muted" />
                  </div>
                  <Button className="bg-primary text-white" onClick={handleUpdateProfile}>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-none">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Automatización AI</CardTitle>
                  <CardDescription>Configure cómo interactúa el motor de IA con sus servicios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recordatorios Automáticos</Label>
                      <p className="text-xs text-muted-foreground">Permitir que la IA sugiera fechas de servicio basadas en el historial.</p>
                    </div>
                    <Switch 
                      checked={profile?.preferences?.autoReminders ?? true} 
                      onCheckedChange={(val) => handleTogglePreference('autoReminders', val)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Generación de Resúmenes</Label>
                      <p className="text-xs text-muted-foreground">Analizar documentación técnica automáticamente para el dashboard.</p>
                    </div>
                    <Switch 
                      checked={profile?.preferences?.autoSummaries ?? true}
                      onCheckedChange={(val) => handleTogglePreference('autoSummaries', val)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "notifications" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Canales de Notificación</CardTitle>
                <CardDescription>Elija cómo desea recibir las alertas críticas del sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label>Alertas por Email</Label>
                      <p className="text-xs text-muted-foreground">Reciba un resumen diario de servicios y facturación.</p>
                    </div>
                  </div>
                  <Switch 
                    checked={profile?.preferences?.emailAlerts ?? true}
                    onCheckedChange={(val) => handleTogglePreference('emailAlerts', val)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-accent/10 rounded-full flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-accent" />
                    </div>
                    <div className="space-y-0.5">
                      <Label>Notificaciones Push</Label>
                      <p className="text-xs text-muted-foreground">Avisos instantáneos sobre cambios en la programación.</p>
                    </div>
                  </div>
                  <Switch 
                    checked={profile?.preferences?.pushAlerts ?? false}
                    onCheckedChange={(val) => handleTogglePreference('pushAlerts', val)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-0.5">
                      <Label>Recordatorios de Vencimiento</Label>
                      <p className="text-xs text-muted-foreground">Alertar 30 días antes de que un extintor caduque.</p>
                    </div>
                  </div>
                  <Switch 
                    checked={profile?.preferences?.dueAlerts ?? true}
                    onCheckedChange={(val) => handleTogglePreference('dueAlerts', val)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Seguridad de la Cuenta</CardTitle>
                <CardDescription>Gestione el acceso y la protección de su perfil administrativo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-status-success/5 border border-status-success/20 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-status-success mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-status-success uppercase">Estado de Seguridad: ÓPTIMO</h4>
                    <p className="text-xs text-muted-foreground">Su cuenta está protegida por políticas de acceso empresarial.</p>
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="curr-pass">Contraseña Actual</Label>
                    <Input id="curr-pass" type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-pass">Nueva Contraseña</Label>
                    <Input id="new-pass" type="password" placeholder="Mínimo 8 caracteres" />
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto">Actualizar Contraseña</Button>
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Pasos (2FA)</Label>
                    <p className="text-xs text-muted-foreground">Añada una capa extra de seguridad a su inicio de sesión.</p>
                  </div>
                  <Switch 
                    checked={profile?.preferences?.twoFactor ?? false}
                    onCheckedChange={(val) => handleTogglePreference('twoFactor', val)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "data" && (
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Gestión de Datos</CardTitle>
                <CardDescription>Exporte su información operativa o realice limpiezas de mantenimiento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-dashed">
                    <Download className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase">Exportar Inventario (CSV)</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border-dashed">
                    <Database className="h-5 w-5 text-primary" />
                    <span className="text-xs font-bold uppercase">Respaldo de Clientes (JSON)</span>
                  </Button>
                </div>

                <Separator />

                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <div>
                      <h4 className="text-sm font-bold text-destructive uppercase">Zona de Peligro</h4>
                      <p className="text-xs text-muted-foreground">Estas acciones son irreversibles y afectan la base de datos local.</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="destructive" size="sm" className="font-bold text-[10px] uppercase">
                      Limpiar Caché de Búsqueda
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 font-bold text-[10px] uppercase">
                      Solicitar Borrado de Cuenta
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 py-4 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Último respaldo automático: Hace 2 horas</p>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase h-7">Configurar Frecuencia</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
