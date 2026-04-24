
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { ShieldCheck, Target, Award, Eye, Flame } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Banner Section */}
        <section className="pt-40 pb-20 bg-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-top pointer-events-none"></div>
          <div className="container mx-auto px-4 text-center space-y-6 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Nuestra Misión Técnica</h1>
            <p className="text-sm md:text-lg opacity-80 font-bold uppercase tracking-widest max-w-2xl mx-auto">
              Liderando la revolución digital en seguridad industrial desde Perú para todo el mundo.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-100">
                <Image 
                  src="https://picsum.photos/seed/about-extinpro/1000/1000" 
                  alt="Equipo EXTINPRO" 
                  fill 
                  className="object-cover"
                  data-ai-hint="engineering team"
                />
              </div>
              <div className="space-y-8">
                <h2 className="text-xs font-black text-accent uppercase tracking-[0.4em]">¿Quiénes somos?</h2>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-primary">EL ESTÁNDAR DIGITAL DE LA SEGURIDAD CONTRA INCENDIOS</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed uppercase">
                  EXTINPRO nació de una necesidad crítica: la falta de trazabilidad y formalización en el mantenimiento de equipos contra incendios. Nuestro equipo de ingenieros y especialistas en software desarrolló una solución integral que no solo gestiona datos, sino que garantiza vidas.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shadow-sm"><Target className="h-5 w-5" /></div>
                    <h4 className="text-sm font-black uppercase">Visión</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Ser el motor tecnológico que impulse a cada taller de extintores a la excelencia operativa.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary shadow-sm"><Eye className="h-5 w-5" /></div>
                    <h4 className="text-sm font-black uppercase">Propósito</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Eliminar el papeleo obsoleto y reemplazarlo por protocolos digitales auditables y seguros.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-xs font-black text-accent uppercase tracking-[0.3em]">Valores Corporativos</h2>
              <p className="text-3xl font-black uppercase tracking-tighter text-primary">NUESTROS PILARES DE CONFIANZA</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Precisión Técnica", desc: "Cálculos y fechas exactas bajo normativa NTP.", icon: Award },
                { title: "Integridad de Datos", desc: "Silos de información privados y encriptados.", icon: ShieldCheck },
                { title: "Pasión por la Seguridad", desc: "Cada línea de código está pensada para salvar vidas.", icon: Flame }
              ].map((v, i) => (
                <div key={i} className="text-center space-y-6">
                  <div className="h-16 w-16 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl text-accent group-hover:scale-110 transition-transform">
                    <v.icon className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-black uppercase text-primary tracking-tight">{v.title}</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
