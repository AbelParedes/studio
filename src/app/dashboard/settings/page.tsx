import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Lock, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">AJUSTES DEL SISTEMA</h2>
        <p className="text-muted-foreground text-sm">Configure sus preferencias de usuario y parámetros generales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <nav className="flex flex-col space-y-1">
            <Button variant="ghost" className="justify-start bg-accent/10 text-accent font-bold"><User className="mr-2 h-4 w-4" /> Perfil de Usuario</Button>
            <Button variant="ghost" className="justify-start"><Bell className="mr-2 h-4 w-4" /> Notificaciones</Button>
            <Button variant="ghost" className="justify-start"><Lock className="mr-2 h-4 w-4" /> Seguridad</Button>
            <Button variant="ghost" className="justify-start"><Database className="mr-2 h-4 w-4" /> Datos y Respaldo</Button>
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Información Personal</CardTitle>
              <CardDescription>Actualice sus datos de contacto y cargo administrativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" defaultValue="Administrador Servifumiga" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email de Contacto</Label>
                  <Input id="email" defaultValue="admin@servifumiga.pro" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo / Rol</Label>
                <Input id="role" defaultValue="Coordinador de Operaciones" disabled />
              </div>
              <Button className="bg-primary text-white">Guardar Cambios</Button>
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generación de Resúmenes</Label>
                  <p className="text-xs text-muted-foreground">Analizar documentación técnica automáticamente para el dashboard.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas Predictivas</Label>
                  <p className="text-xs text-muted-foreground">Notificar sobre posibles brotes de plagas según tendencias estacionales.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
