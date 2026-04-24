
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { ShieldCheck, Cloud, Headphones, UserCheck, Zap, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Banner */}
        <section className="pt-40 pb-20 bg-[#1c1c1c] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-white/5 skew-y-6 transform origin-center"></div>
          <div className="container mx-auto px-4 text-center space-y-6 relative z-10">
            <h2 className="text-xs font-black text-accent uppercase tracking-[0.4em]">Valor Agregado</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">NUESTROS SERVICIOS CORPORATIVOS</h1>
            <p className="text-sm md:text-lg text-slate-400 font-bold uppercase tracking-widest max-w-3xl mx-auto">
              Mucho más que una licencia de software. Acompañamos el crecimiento de tu empresa de seguridad.
            </p>
          </div>
        </section>

        {/* Services Cards */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                { 
                  title: "Implementación SaaS", 
                  desc: "Configuramos tu entorno de trabajo, cargamos tu logotipo institucional y personalizamos tus firmas digitales en menos de 24 horas.",
                  icon: Zap 
                },
                { 
                  title: "Capacitación Técnica", 
                  desc: "Entrenamos a tu equipo administrativo y técnico en el uso eficiente de los módulos de inspección y certificación bajo NTP.",
                  icon: UserCheck 
                },
                { 
                  title: "Soporte Prioritario", 
                  desc: "Acceso directo a nuestro equipo de ingeniería vía WhatsApp y correo para resolver cualquier duda operativa en tiempo real.",
                  icon: Headphones 
                },
                { 
                  title: "Infraestructura Cloud", 
                  desc: "Tus datos residen en servidores de alta disponibilidad con respaldos automáticos diarios. Seguridad bancaria para tu información.",
                  icon: Cloud 
                },
                { 
                  title: "Consultoría de Procesos", 
                  desc: "Asesoría para optimizar tu flujo de recargas y mantenimientos, reduciendo tiempos muertos y aumentando la rentabilidad.",
                  icon: Layers 
                },
                { 
                  title: "Seguridad ISO", 
                  desc: "Nuestros procesos de manejo de datos cumplen con los más altos estándares internacionales de ciberseguridad industrial.",
                  icon: ShieldCheck 
                }
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-6 p-10 border-2 border-slate-50 rounded-[3rem] hover:border-accent/20 transition-colors">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner"><s.icon className="h-8 w-8" /></div>
                  <h3 className="text-xl font-black uppercase text-primary tracking-tight">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h3 className="text-2xl font-black uppercase text-primary">¿ERES UNA CONSULTORA DE SEGURIDAD?</h3>
              <p className="text-[11px] font-bold uppercase text-slate-500 leading-relaxed">Ofrecemos un programa de partners para que puedas ofrecer EXTINPRO a tus clientes certificados y generar ingresos recurrentes.</p>
              <Link href="/contacto">
                <Button variant="outline" className="h-12 border-2 border-primary text-primary font-black uppercase text-[10px] px-10">Solicitar Información de Partner</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
