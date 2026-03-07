
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ShieldCheck, Zap, Crown, Building2, Star, Loader2, ArrowRight, Info, MessageSquare } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, doc, updateDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const PLANS = [
  {
    id: "Demo",
    name: "Demo",
    price: "S/ 0",
    description: "Ideal para conocer la plataforma y sus funciones básicas sin costo.",
    features: [
      "Hasta 10 Clientes",
      "1 Usuario",
      "Gestión de Extintores",
      "Reportes Limitados",
      "Vigencia por 15 días"
    ],
    icon: Info,
    color: "text-slate-400",
    bgColor: "bg-slate-50"
  },
  {
    id: "Básico",
    name: "Básico",
    price: "S/ 99",
    description: "Ideal para técnicos independientes o pequeñas empresas.",
    features: [
      "Hasta 100 Clientes",
      "1 Usuario Administrador",
      "Gestión de Extintores",
      "Reportes Básicos",
      "Soporte por Email"
    ],
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    id: "Profesional",
    name: "Profesional",
    price: "S/ 249",
    description: "Para empresas en crecimiento que necesitan automatización.",
    features: [
      "Clientes Ilimitados",
      "Hasta 10 Usuarios",
      "Recordatorios IA (Genkit)",
      "Proformas Personalizadas",
      "Reportes Avanzados",
      "Soporte Prioritario"
    ],
    icon: Star,
    color: "text-accent",
    bgColor: "bg-accent/5",
    popular: true
  },
  {
    id: "Empresarial",
    name: "Empresarial",
    price: "S/ 599",
    description: "Solución total para grandes corporaciones de seguridad.",
    features: [
      "Todo lo de Profesional",
      "Usuarios Ilimitados",
      "API de Integración",
      "Multisucursal",
      "Capacitación Personalizada",
      "Soporte 24/7 Dedicado"
    ],
    icon: Crown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  }
]

export default function PlansPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0]

  const companyRef = useMemoFirebase(() => 
    profile?.companyId ? doc(db, "companies", profile.companyId) : null,
  [db, profile?.companyId])
  const { data: company, isLoading: loadingCompany } = useDoc(companyRef)

  const roleRef = useMemoFirebase(() => 
    profile?.roleId ? doc(db, "system_roles", profile.roleId) : null,
  [db, profile?.roleId])
  const { data: roleData } = useDoc(roleRef)

  const isSuperAdmin = roleData?.title === "Super Administrador" || roleData?.permissions?.manage_saas === true
  const currentPlan = company?.plan || "Demo"

  const handleUpdatePlan = async (planId: string) => {
    if (!isSuperAdmin) {
      toast({ 
        title: "Acción no permitida", 
        description: "Solo el SaaS Master puede realizar migraciones de planes. Contacte a soporte." 
      })
      return
    }

    if (!profile?.companyId) return
    
    setIsUpdating(planId)
    try {
      await updateDoc(doc(db, "companies", profile.companyId), {
        plan: planId,
        updatedAt: new Date().toISOString()
      })
      toast({ 
        title: "Suscripción Actualizada", 
        description: `La organización ha sido migrada al plan ${planId} exitosamente.` 
      })
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error de Suscripción", 
        description: "No se pudo procesar el cambio de plan." 
      })
    } finally {
      setIsUpdating(null)
    }
  }

  if (loadingProfile || loadingCompany) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consultando Suscripción...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 py-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[10px] tracking-widest py-1 px-4">
            Catálogo de Servicios SaaS
          </Badge>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-primary">Planes de Alto Rendimiento</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm font-medium uppercase tracking-wider">
          {isSuperAdmin 
            ? "Gestión maestra de planes para la organización seleccionada." 
            : "Explore las capacidades operativas de cada nivel de suscripción."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const updatingThis = isUpdating === plan.id

          return (
            <Card key={plan.id} className={cn(
              "relative flex flex-col shadow-xl border-none overflow-hidden transition-all duration-300",
              plan.popular ? "ring-2 ring-accent scale-[1.02] z-10" : "border border-slate-100",
              isCurrent ? "bg-white ring-2 ring-primary" : "bg-white/90 hover:scale-[1.03]"
            )}>
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="bg-accent text-white rounded-none rounded-bl-lg uppercase font-black text-[9px] px-3 py-1 shadow-md">Más Recomendado</Badge>
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-0 left-0">
                  <Badge className="bg-primary text-white rounded-none rounded-br-lg uppercase font-black text-[9px] px-3 py-1 shadow-md flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Plan Actual
                  </Badge>
                </div>
              )}
              
              <CardHeader className="space-y-2 pb-8 pt-10">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-2 shadow-inner", plan.bgColor)}>
                  <plan.icon className={cn("h-7 w-7", plan.color)} />
                </div>
                <CardTitle className="text-2xl font-black uppercase text-primary tracking-tighter">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase">/ mes</span>
                </div>
                <CardDescription className="text-xs font-bold leading-relaxed uppercase tracking-tight text-slate-500">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="h-px bg-slate-100 w-full"></div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[11px] font-bold text-slate-600 uppercase">
                      <div className="h-5 w-5 rounded-full bg-status-success/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-status-success" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-8 pb-8">
                {isSuperAdmin ? (
                  <Button 
                    onClick={() => handleUpdatePlan(plan.id)}
                    className={cn(
                      "w-full h-12 font-black uppercase text-xs tracking-widest shadow-xl transition-all",
                      isCurrent 
                        ? "bg-status-success hover:bg-status-success/90 cursor-default" 
                        : "bg-[#1c1c1c] hover:bg-primary text-white"
                    )}
                    disabled={isCurrent || !!isUpdating}
                  >
                    {updatingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      <><ShieldCheck className="mr-2 h-4 w-4" /> Plan Activo</>
                    ) : (
                      <><ArrowRight className="mr-2 h-4 w-4" /> Aplicar Plan</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant={isCurrent ? "default" : "outline"}
                    className={cn(
                      "w-full h-12 font-black uppercase text-xs tracking-widest",
                      isCurrent && "bg-status-success text-white hover:bg-status-success pointer-events-none"
                    )}
                    asChild={!isCurrent}
                  >
                    {isCurrent ? (
                      <><ShieldCheck className="mr-2 h-4 w-4" /> Mi Suscripción</>
                    ) : (
                      <a 
                        href={`https://wa.me/51918790212?text=Hola,%20deseo%20solicitar%20una%20mejora%20de%20mi%20plan%20en%20Servifumiga%20Pro.%20Me%20interesa%20el%20plan%20${plan.name}.`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" /> Solicitar Mejora
                      </a>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {!isSuperAdmin && (
        <div className="max-w-4xl mx-auto bg-primary text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-b-[8px] border-accent">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg">
              <Building2 className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter">¿Desea cambiar su plan?</h3>
              <p className="text-sm opacity-80 font-medium leading-relaxed max-w-md uppercase text-[11px] font-bold tracking-wider">
                Las migraciones de suscripción son gestionadas por el equipo de Servifumiga Pro para garantizar la integridad de sus datos.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="h-14 border-2 border-white text-white hover:bg-white hover:text-primary font-black uppercase text-xs tracking-widest px-10 transition-all rounded-xl"
            asChild
          >
            <a 
              href="https://wa.me/51918790212?text=Hola,%20necesito%20soporte%20para%20cambiar%20mi%20plan%20en%20Servifumiga%20Pro." 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Hablar con Soporte
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
