
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ShieldCheck, Zap, Crown, Building2, Star, Loader2 } from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

const PLANS = [
  {
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

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  const { data: profiles, isLoading: loadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0]

  const companyRef = useMemoFirebase(() => 
    profile?.companyId ? doc(db, "companies", profile.companyId) : null,
  [db, profile?.companyId])
  const { data: company, isLoading: loadingCompany } = useDoc(companyRef)

  const currentPlan = company?.plan || "Básico"

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
        <h2 className="text-3xl font-black uppercase tracking-tight text-primary">Planes de Suscripción SaaS</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm font-medium uppercase tracking-wider">
          Escala tu operación de seguridad y fumigación con nuestras herramientas de alto rendimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === currentPlan
          return (
            <Card key={plan.name} className={cn(
              "relative flex flex-col shadow-xl border-none overflow-hidden transition-all hover:scale-[1.02]",
              plan.popular ? "ring-2 ring-accent" : "border border-slate-100",
              isCurrent ? "bg-white" : "bg-white/90"
            )}>
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="bg-accent text-white rounded-none rounded-bl-lg uppercase font-black text-[9px] px-3 py-1">Más Popular</Badge>
                </div>
              )}
              
              <CardHeader className="space-y-2 pb-8">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-2", plan.bgColor)}>
                  <plan.icon className={cn("h-6 w-6", plan.color)} />
                </div>
                <CardTitle className="text-2xl font-black uppercase text-primary">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-xs font-bold uppercase">/ mes</span>
                </div>
                <CardDescription className="text-xs font-medium leading-relaxed uppercase font-bold tracking-tight">{plan.description}</CardDescription>
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
              
              <CardFooter className="pt-8">
                <Button 
                  className={cn(
                    "w-full h-12 font-black uppercase text-xs tracking-widest shadow-lg",
                    isCurrent ? "bg-status-success hover:bg-status-success/90 cursor-default" : "bg-primary hover:bg-primary/90"
                  )}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    <><ShieldCheck className="mr-2 h-4 w-4" /> Plan Actual</>
                  ) : (
                    "Cambiar a este Plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="max-w-4xl mx-auto bg-primary text-white p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-b-[6px] border-accent">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <Building2 className="h-8 w-8 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight">¿Necesitas un Plan a Medida?</h3>
            <p className="text-sm opacity-80 font-medium">Ofrecemos soluciones personalizadas para corporativos con más de 50 técnicos y múltiples sucursales.</p>
          </div>
        </div>
        <Button variant="outline" className="h-12 border-white text-white hover:bg-white hover:text-primary font-black uppercase text-xs tracking-widest px-8">
          Contactar Soporte
        </Button>
      </div>
    </div>
  )
}
