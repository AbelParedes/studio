
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { HardDrive, FileText, Smartphone, LayoutDashboard, Key, ClipboardList, Shield } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProductsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Banner */}
        <section className="pt-40 pb-20 bg-slate-50 border-b">
          <div className="container mx-auto px-4 text-center space-y-6">
            <h2 className="text-xs font-black text-accent uppercase tracking-[0.4em]">Soluciones Software</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-primary">EXTINPRO TECHNICAL SUITE</h1>
            <p className="text-sm md:text-lg text-muted-foreground font-bold uppercase tracking-widest max-w-3xl mx-auto">
              Una arquitectura modular diseñada específicamente para el sector de seguridad contra incendios.
            </p>
          </div>
        </section>

        {/* Modules Detail */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 space-y-32">
            {[
              {
                title: "Gestión de Activos y Hoja de Vida",
                desc: "Mantén un registro impecable de cada extintor, gabinete y detector. Nuestro motor permite adjuntar fotos, historial de presiones y fechas de fabricación para una auditoría perfecta.",
                icon: HardDrive,
                img: "https://picsum.photos/seed/p-assets/800/600",
                features: ["Sincronización en la nube", "Búsqueda por Serie/NTP", "Ubicación detallada"]
              },
              {
                title: "Protocolos y Certificación Digital",
                desc: "Emite protocolos de operatividad técnica en segundos. Las firmas digitales de tus técnicos acreditados se insertan automáticamente en documentos PDF con validez oficial.",
                icon: FileText,
                img: "https://picsum.photos/seed/p-cert/800/600",
                features: ["Firmas escaneadas", "Plantillas industriales", "Descarga A4 instantánea"],
                reverse: true
              },
              {
                title: "Panel Comercial y Cotizaciones",
                desc: "Gestiona tu catálogo de productos y servicios. Genera proformas profesionales con cálculo dinámico de impuestos (IGV) y conviértelas en órdenes de servicio con un clic.",
                icon: ClipboardList,
                img: "https://picsum.photos/seed/p-comm/800/600",
                features: ["Control de stock", "Tarifarios dinámicos", "Conversión a Orden de Trabajo"]
              }
            ].map((module, i) => (
              <div key={i} className={cn("grid grid-cols-1 lg:grid-cols-2 gap-16 items-center", module.reverse && "lg:flex-row-reverse")}>
                <div className={cn("space-y-8", module.reverse && "lg:order-2")}>
                  <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center text-accent shadow-lg"><module.icon className="h-7 w-7" /></div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-primary">{module.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed uppercase">{module.desc}</p>
                  <ul className="space-y-3">
                    {module.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[11px] font-black uppercase text-primary">
                        <div className="h-5 w-5 bg-status-success/10 rounded-full flex items-center justify-center"><Key className="h-3 w-3 text-status-success" /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn("relative h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50", module.reverse && "lg:order-1")}>
                  <Image src={module.img} alt={module.title} fill className="object-cover" unoptimized />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-24 bg-primary text-white">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h3 className="text-3xl font-black uppercase tracking-tighter">¿NECESITAS UNA SOLUCIÓN A MEDIDA?</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 max-w-xl mx-auto">Nuestro plan Empresarial permite integraciones vía API y personalización total de módulos técnicos.</p>
            <Link href="/contacto">
              <Button className="bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs h-14 px-12 tracking-widest shadow-2xl">Hablar con un Especialista</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
