
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, AlertCircle, Building2, UserPlus, LogIn, Clock, ShieldAlert, Sparkles } from "lucide-react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth"
import { doc, setDoc, collection, addDoc, getDocs, query, where, limit } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [fullName, setFullName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMasterLogging, setIsMasterLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleMasterLogin = async () => {
    setIsMasterLogging(true)
    setError(null)
    try {
      // Para el prototipo, usamos un login anónimo que mapeamos a un perfil de Super Admin
      const userCredential = await signInAnonymously(auth)
      const masterUid = userCredential.user.uid
      
      // Creamos/Aseguramos el rol de Super Administrador en Firestore
      const rolesRef = collection(db, "system_roles")
      const rolesSnap = await getDocs(query(rolesRef, where("title", "==", "Super Administrador"), limit(1)))
      let roleId = rolesSnap.docs[0]?.id

      if (!roleId) {
        const newRoleRef = await addDoc(rolesRef, {
          title: "Super Administrador",
          description: "Acceso total al sistema SaaS Master.",
          permissions: { manage_saas: true, manage_users: true, manage_inventory: true, view_reports: true, manage_clients: true, field_operations: true }
        })
        roleId = newRoleRef.id
      }

      // Creamos el perfil de usuario con este rol
      await setDoc(doc(db, "company_users", masterUid), {
        id: masterUid,
        name: "SaaS Master Admin",
        email: "master@servifumiga.pro",
        roleId: roleId,
        status: "Active",
        companyId: "saas-master-hq",
        createdAt: new Date().toISOString()
      }, { merge: true })

      toast({ title: "Acceso Maestro Concedido", description: "Entorno Super Administrador activado." })
      router.push("/dashboard")
    } catch (err: any) {
      setError("Error al activar acceso maestro: " + err.message)
    } finally {
      setIsMasterLogging(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password)
        toast({ title: "Iniciando sesión..." })
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user

        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName || "Mi Nueva Empresa",
          taxId: "Pendiente",
          status: "Pending",
          createdAt: new Date().toISOString(),
          primaryColor: "#1a2b3c",
          accentColor: "#d9534f",
          themeMode: "light"
        })

        await setDoc(doc(db, "company_users", newUser.uid), {
          id: newUser.uid,
          companyId: companyRef.id,
          name: fullName || email.split('@')[0],
          email: email,
          roleId: "Administrador",
          status: "Pending",
          createdAt: new Date().toISOString()
        })

        toast({ 
          title: "Registro exitoso", 
          description: "Tu solicitud ha sido enviada para aprobación del SaaS Master." 
        })
        setMode("login")
      }
    } catch (err: any) {
      setIsSubmitting(false)
      if (err.code === 'auth/invalid-credential') {
        setError("Credenciales incorrectas.")
      } else if (err.code === 'auth/email-already-in-use') {
        setError("El correo ya está registrado.")
      } else {
        setError("Error: " + err.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f4f7f6] p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tighter uppercase text-primary">
            SERVIFUMIGA <span className="text-accent-foreground/50">PRO</span>
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {mode === "login" ? "Plataforma SaaS de Gestión Operativa" : "Únete a la red de Servifumiga Pro"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px]">{error}</AlertDescription>
              </Alert>
            )}

            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase">Nombre del Responsable</Label>
                  <Input id="fullName" placeholder="Ej. Carlos Mendoza" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-bold uppercase">Nombre de la Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="companyName" placeholder="Ej. Fumigaciones Perú SAC" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="usuario@empresa.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" name="password" className="text-xs font-bold uppercase">Contraseña</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-lg mt-2" disabled={isSubmitting || isMasterLogging}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="mr-2 h-4 w-4" /> Entrar al Sistema</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Solicitar Acceso SaaS</>
              )}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleMasterLogin} 
                disabled={isSubmitting || isMasterLogging}
                className="w-full h-11 border-accent text-accent hover:bg-accent hover:text-white font-black uppercase text-[10px] tracking-widest shadow-sm"
              >
                {isMasterLogging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Acceso Maestro (Super Admin)
              </Button>
            </div>
          )}

          {mode === "register" && (
            <Alert className="mt-4 bg-primary/5 border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <AlertTitle className="text-[10px] font-bold uppercase">Proceso de Verificación</AlertTitle>
              <AlertDescription className="text-[9px] text-muted-foreground uppercase leading-tight">
                Todas las solicitudes de registro están sujetas a aprobación manual por el administrador maestro del sistema.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center">
            <button 
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[11px] font-bold uppercase text-primary hover:underline"
            >
              {mode === "login" ? "¿Nuevo en la plataforma? Solicita tu cuenta" : "Ya tengo una cuenta, ir al login"}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/20 py-4">
          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
            Servifumiga Pro SaaS v2.5 - Master HQ
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
