
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, AlertCircle, Building2, UserPlus, LogIn } from "lucide-react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, collection, addDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [fullName, setFullName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password)
        toast({ title: "Bienvenido", description: "Iniciando sesión..." })
      } else {
        // 1. Crear usuario en Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user

        // 2. Crear Empresa Inicial
        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName || "Mi Nueva Empresa",
          taxId: "Pendiente",
          createdAt: new Date().toISOString(),
          primaryColor: "#1a2b3c",
          accentColor: "#d9534f",
          themeMode: "light"
        })

        // 3. Crear Perfil de Usuario Administrador
        await setDoc(doc(db, "company_users", newUser.uid), {
          id: newUser.uid,
          companyId: companyRef.id,
          name: fullName || email.split('@')[0],
          email: email,
          roleId: "Administrador", // Asignamos el nombre del rol directamente para facilitar el acceso inicial
          status: "Active",
          createdAt: new Date().toISOString()
        })

        toast({ title: "Cuenta creada", description: "Tu organización ha sido inicializada con éxito." })
      }
    } catch (err: any) {
      setIsSubmitting(false)
      console.error(err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Credenciales incorrectas. Verifique sus datos.")
      } else if (err.code === 'auth/email-already-in-use') {
        setError("El correo ya está registrado en el sistema.")
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña debe tener al menos 6 caracteres.")
      } else {
        setError("Error en la operación: " + err.message)
      }
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
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {mode === "login" ? "Gestión Operativa - Perú" : "Registro de Nueva Organización"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] leading-tight">{error}</AlertDescription>
              </Alert>
            )}

            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-bold uppercase">Nombre Completo</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Juan Pérez" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-bold uppercase">Nombre de tu Empresa</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="companyName" 
                      placeholder="Ej. Fumigaciones Lima SAC" 
                      required 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@servifumiga.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" name="password" className="text-xs font-bold uppercase">Contraseña</Label>
                {mode === "login" && (
                  <Button type="button" variant="link" className="text-[10px] p-0 h-auto font-bold uppercase text-muted-foreground">¿Olvidó su clave?</Button>
                )}
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-lg mt-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Registrar Empresa</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[11px] font-bold uppercase text-primary hover:underline"
            >
              {mode === "login" 
                ? "¿No tienes cuenta? Registra tu empresa aquí" 
                : "Ya tengo una cuenta, iniciar sesión"}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/20 py-4">
          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
            Acceso restringido para personal autorizado.
          </p>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-2 uppercase font-medium">
            © 2024 Servifumiga Pro Perú v2.5
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
