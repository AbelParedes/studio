
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push("/dashboard")
    }
  }, [user, isUserLoading, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    signInWithEmailAndPassword(auth, email, password)
      .catch((err: any) => {
        setIsSubmitting(false)
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError("Las credenciales son incorrectas. Por favor, verifique su usuario y contraseña.")
        } else {
          setError("Error al iniciar sesión: " + err.message)
        }
      })
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
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tighter uppercase text-primary">SERVIFUMIGA <span className="text-accent-foreground/50">PRO</span></CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sistema de Gestión Operativa - Perú</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] leading-tight">{error}</AlertDescription>
              </Alert>
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
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" name="password" className="text-xs font-bold uppercase">Contraseña</Label>
                <Button type="button" variant="link" className="text-[10px] p-0 h-auto font-bold uppercase text-muted-foreground">¿Olvidó su clave?</Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary text-white font-bold uppercase tracking-widest text-xs shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/20 py-6">
          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
            Acceso restringido para personal autorizado.
          </p>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-4 uppercase font-medium">
            © 2024 Servifumiga Pro Perú v2.5
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
