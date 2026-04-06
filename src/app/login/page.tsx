
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, AlertCircle, Building2, UserPlus, LogIn, Clock, Gift, Flame, KeyRound, ArrowLeft } from "lucide-react"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, collection, addDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const EXTINPRO_LOGO = "https://img.freepik.com/vector-gratis/estilo-plano-llama_78370-7477.jpg?semt=ais_incoming&w=740&q=80"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login")
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
        toast({ title: "Iniciando sesión..." })
      } else if (mode === "register") {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user

        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName || "Nueva Empresa de Extintores",
          taxId: "Pendiente",
          status: "Pending",
          plan: "Demo",
          createdAt: new Date().toISOString(),
          primaryColor: "#1a2b3c",
          accentColor: "#d9534f",
          themeMode: "light",
          logoUrl: EXTINPRO_LOGO
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
          title: "Registro de EXTINPRO exitoso", 
          description: "Tu solicitud de acceso técnico ha sido enviada para aprobación." 
        })
        setMode("login")
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email)
        toast({ 
          title: "Correo enviado", 
          description: "Se han enviado las instrucciones de recuperación a su bandeja de entrada." 
        })
        setMode("login")
      }
    } catch (err: any) {
      setIsSubmitting(false)
      if (err.code === 'auth/invalid-credential') {
        setError("Credenciales incorrectas.")
      } else if (err.code === 'auth/email-already-in-use') {
        setError("El correo ya está registrado.")
      } else if (err.code === 'auth/user-not-found') {
        setError("No existe una cuenta con este correo electrónico.")
      } else if (err.code === 'auth/too-many-requests') {
        setError("Demasiados intentos. Intente más tarde.")
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
          <div className="mx-auto h-20 w-20 relative mb-4">
            <Image 
              src={EXTINPRO_LOGO} 
              alt="EXTINPRO Logo" 
              fill 
              className="object-contain rounded-full shadow-lg border-b-4 border-accent"
              unoptimized
            />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter uppercase text-primary">
            EXTIN<span className="text-accent">PRO</span>
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex flex-col items-center gap-2">
            {mode === "login" && "SISTEMA DE GESTIÓN TÉCNICA DE EXTINTORES"}
            {mode === "forgot" && "RECUPERACIÓN DE CONTRASEÑA"}
            {mode === "register" && (
              <>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
                  <Gift className="mr-1 h-3 w-3" /> ACTIVACIÓN PLAN DEMO
                </Badge>
                Acceso gratuito por 15 días para su empresa
              </>
            )}
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
                    <Input id="companyName" placeholder="Ej. Seguridad Contra Incendios SAC" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@empresa.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" name="password" className="text-xs font-bold uppercase">Contraseña</Label>
                  {mode === "login" && (
                    <button 
                      type="button" 
                      onClick={() => setMode("forgot")}
                      className="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary transition-colors"
                    >
                      ¿Olvidó su clave?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-lg mt-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <><LogIn className="mr-2 h-4 w-4" /> Acceder al Panel</>
              ) : mode === "register" ? (
                <><UserPlus className="mr-2 h-4 w-4" /> Registrar mi Empresa</>
              ) : (
                <><KeyRound className="mr-2 h-4 w-4" /> Enviar Instrucciones</>
              )}
            </Button>
          </form>

          {mode === "forgot" && (
            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => setMode("login")}
                className="text-[11px] font-bold uppercase text-primary flex items-center justify-center w-full hover:underline"
              >
                <ArrowLeft className="mr-2 h-3 w-3" /> Volver al inicio de sesión
              </button>
            </div>
          )}

          {mode === "register" && (
            <Alert className="mt-4 bg-primary/5 border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <AlertTitle className="text-[10px] font-bold uppercase">Términos de Prueba</AlertTitle>
              <AlertDescription className="text-[9px] text-muted-foreground uppercase leading-tight">
                El Plan Demo incluye 10 clientes, 1 usuario y vigencia de 15 días. Sujeto a aprobación técnica.
              </AlertDescription>
            </Alert>
          )}

          {mode !== "forgot" && (
            <div className="mt-6 text-center">
              <button 
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-[11px] font-bold uppercase text-primary hover:underline"
              >
                {mode === "login" ? "¿Nueva empresa? Pruebe EXTINPRO gratis" : "Ya tengo cuenta, iniciar sesión"}
              </button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/20 py-4">
          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
            EXTINPRO Technical Suite v3.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
