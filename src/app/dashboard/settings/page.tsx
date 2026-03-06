"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Lock, Database, Loader2, Save, LogOut } from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useAuth } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  
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
      // Si no existe el documento, usamos los datos de Auth por defecto
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || ""
      }))
    }
  }, [profile, user, isLoading])

  const handleUpdateProfile = () => {
    if (!userProfileRef) return

    // Usamos setDoc con merge para asegurar que el documento exista
    setDoc(userProfileRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true })
      .then(() => {
        toast({ title: "Perfil actualizado", description: "Tus cambios se han guardado correctamente." })
      })
      .catch((e) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <nav className="flex flex-col space-y-1">
            <Button variant="ghost" className="justify-start bg-accent/10 text-accent font-bold">
              <User className="mr-2 h-4 w-4" /> Perfil de Usuario
            </Button>
            <Button variant="ghost" className="justify-start">
              <Bell className="mr-2 h-4 w-4" /> Notificaciones
            </Button>
            <Button variant="ghost" className="justify-start">
              <Lock className="mr-2 h-4 w-4" /> Seguridad
            </Button>
            <Button variant="ghost" className="justify-start">
              <Database className="mr-2 h-4 w-4" /> Datos y Respaldo
            </Button>
            <Separator className="my-2" />
            <Button 
              variant="ghost" 
              className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
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
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas Predictivas</Label>
                  <p className="text-xs text-muted-foreground">Notificar sobre posibles brotes de plagas según tendencias estacionales.</p>
                </div>
                <Switch 
                  checked={profile?.preferences?.predictiveAlerts ?? false}
                  onCheckedChange={(val) => handleTogglePreference('predictiveAlerts', val)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
