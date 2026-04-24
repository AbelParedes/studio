
"use client"

import Link from "next/link"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { Button } from "@/components/ui/button"
import { 
  Flame, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  FileText, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  HardDrive,
  Users
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden bg-slate-50">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-primary/5 skew-x-12 transform origin-top pointer-events-none"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm animate-bounce">
                  <Badge className="bg-accent text-white uppercase text-[8px] font-black">Nuevo v3.0</Badge>
                  <span className="text-[9px] font-black uppercase text-primary tracking-widest">Gestión Técnica Automatizada</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-primary uppercase leading-[0.95]">
                  TRANSFORMA TU EMPRESA DE <span className="text-accent underline decoration-4 underline-offset-8">EXTINTORES</span>
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed uppercase tracking-tight">
                  La plataforma SaaS líder en Perú para el control técnico, comercial y cumplimiento de la normativa NTP 350.043-1. Más que un software, es tu aliado en seguridad industrial.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/login?mode=register" className="w-full sm:w-auto">
                    <Button className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-widest px-10 shadow-2xl hover:scale-105 transition-transform">
                      Probar Gratis 15 Días <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contacto" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full h-14 border-2 font-black uppercase text-xs tracking-widest px-10">
                      Ver Demo en Vivo
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 opacity-50 grayscale hover:opacity-100 transition-all cursor-default">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cumple con:</p>
                  <span className="text-[12px] font-black italic">INDECOPI</span>
                  <span className="text-[12px] font-black italic">SUNA</span>
                  <span className="text-[12px] font-black italic">ISO 9001</span>
                </div>
              </div>
              <div className="relative h-[400px] lg:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                <Image 
                  src="https://picsum.photos/seed/extinprohero/1200/800" 
                  alt="Dashboard EXTINPRO" 
                  fill 
                  className="object-cover"
                  data-ai-hint="dashboard screen"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-xs font-black text-accent uppercase tracking-[0.3em]">Capacidades Técnicas</h2>
              <p className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-primary">TODO LO QUE TU TALLER NECESITA EN UNA SOLA NUBE</p>
              <div className="h-1.5 w-24 bg-accent mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  title: "Hoja de Vida Digital", 
                  desc: "Trazabilidad completa de cada extintor por N° de serie, ubicación y fabricante.",
                  icon: HardDrive 
                },
                { 
                  title: "Protocolos NTP", 
                  desc: "Generación automática de certificados de operatividad bajo norma 350.043-1.",
                  icon: FileText 
                },
                { 
                  title: "Recordatorios IA", 
                  desc: "Inteligencia artificial que predice fechas de recarga y mantenimiento para tus clientes.",
                  icon: Zap 
                },
                { 
                  title: "Gestión de Personal", 
                  desc: "Control de técnicos en campo con firmas digitales autorizadas y geolocalización.",
                  icon: Users 
                },
                { 
                  title: "Proformas Pro", 
                  desc: "Crea cotizaciones comerciales con diseño industrial listas para enviar por WhatsApp.",
                  icon: Smartphone 
                },
                { 
                  title: "Seguridad SaaS", 
                  desc: "Tus datos están protegidos en silos individuales para cada empresa. Privacidad total.",
                  icon: ShieldCheck 
                }
              ].map((f, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-300">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase text-primary mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Numbers */}
        <section className="py-20 bg-primary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 -skew-y-6 transform origin-center"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black mb-2 text-accent tracking-tighter">+500</div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Empresas Activas</p>
              </div>
              <div>
                <div className="text-4xl font-black mb-2 text-accent tracking-tighter">1.2M</div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Equipos Registrados</p>
              </div>
              <div>
                <div className="text-4xl font-black mb-2 text-accent tracking-tighter">100%</div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Cumplimiento NTP</p>
              </div>
              <div>
                <div className="text-4xl font-black mb-2 text-accent tracking-tighter">24/7</div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Soporte Técnico</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl border-b-[12px] border-accent relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-slate-50 skew-x-12 transform origin-top pointer-events-none"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="space-y-6 text-center lg:text-left">
                  <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter text-primary leading-none">
                    ¿LISTO PARA <span className="text-accent">DIGITALIZAR</span> TU TALLER?
                  </h2>
                  <p className="text-sm font-bold uppercase text-muted-foreground tracking-wide max-w-lg">
                    Únete a la red más grande de servicios de extintores en el país. Empieza tu prueba gratuita hoy mismo.
                  </p>
                </div>
                <div className="flex flex-col gap-4 w-full lg:w-auto">
                  <Link href="/login?mode=register">
                    <Button className="w-full lg:w-auto h-16 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] px-12 shadow-xl">
                      Crear Cuenta Gratis
                    </Button>
                  </Link>
                  <p className="text-[9px] font-black uppercase text-center text-slate-400">Sin tarjetas de crédito. Activación instantánea.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
