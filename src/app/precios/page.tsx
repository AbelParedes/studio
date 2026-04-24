
"use client"

import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ShieldCheck, Zap, Crown, Info, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const PLANS = [
  {
    id: "Demo",
    name: "Plan Demo",
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
    name: "Plan Básico",
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
    name: "Plan Profesional",
    price: "S/ 249",
    description: "Para empresas en crecimiento que necesitan automatización.",
    features: [
      "Clientes Ilimitados",
      "Hasta 10 Usuarios",
      "Recordatorios IA (EXTINPRO)",
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
    name: "Plan Empresarial",
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

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1">
        <section className="pt-40 pb-20 bg-primary text-white text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-top pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">INVERSIÓN TÉCNICA</h1>
            <p className="text-sm md:text-lg text-slate-300 font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
              Elige el plan que mejor se adapte al volumen de tu taller y escala tu negocio digitalmente.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {PLANS.map((plan) => (
                <div key={plan.id} className={cn(
                  "relative flex flex-col bg-white rounded-[2.5rem] shadow-xl border-none overflow-hidden transition-all duration-300 group",
                  plan.popular ? "ring-4 ring-accent scale-[1.05] z-10" : "hover:scale-[1.02]"
                )}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="bg-accent text-white rounded-none rounded-bl-xl uppercase font-black text-[9px] px-4 py-2 shadow-md">Más Recomendado</Badge>
                    </div>
                  )}

                  <div className="p-10 space-y-6">
                    <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner", plan.bgColor)}>
                      <plan.icon className={cn("h-8 w-8", plan.color)} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase text-primary tracking-tight">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-primary tracking-tighter">{plan.price}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400">/ mes</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 leading-relaxed">{plan.description}</p>
                    
                    <div className="h-px bg-slate-100 w-full"></div>
                    
                    <ul className="space-y-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold uppercase text-slate-600">
                          <div className="h-5 w-5 bg-status-success/10 rounded-full flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-status-success" /></div>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6">
                      <Link href={`/login?mode=register&plan=${plan.id}`}>
                        <Button className={cn(
                          "w-full h-14 font-black uppercase text-xs tracking-widest shadow-xl transition-all",
                          plan.popular ? "bg-accent text-white hover:bg-accent/90" : "bg-primary text-white hover:bg-primary/90"
                        )}>
                          Empezar Ahora
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-20 max-w-4xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-primary">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary shadow-inner"><ShieldCheck className="h-10 w-10" /></div>
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-primary leading-none">¿TIENES MÁS DE 10 SEDES?</h4>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Consulta por nuestra solución Multisucursal y despliegue local.</p>
                </div>
              </div>
              <Link href="/contacto">
                <Button variant="outline" className="h-14 border-2 font-black uppercase text-xs px-12 tracking-widest">Cotización Especial</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
