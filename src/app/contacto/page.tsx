import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Shield, Zap } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-slate-50">
        <section className="pt-40 pb-24 lg:pt-56">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              {/* Info Column */}
              <div className="lg:col-span-5 space-y-12">
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-accent uppercase tracking-[0.4em]">Canales de Venta</h2>
                  <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase text-primary leading-none">CONTÁCTANOS</h1>
                  <p className="text-sm font-medium text-muted-foreground uppercase leading-relaxed max-w-md">
                    Nuestro equipo de especialistas está listo para ayudarte a digitalizar tu empresa de seguridad. Respondemos en menos de 2 horas.
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    { icon: Phone, title: "Llámanos / WhatsApp", val: "+51 918 790 212", desc: "Atención comercial inmediata." },
                    { icon: Mail, title: "Correo Electrónico", val: "ventas@extinpro.pe", desc: "Para solicitudes corporativas." },
                    { icon: MapPin, title: "Ubicación", val: "Lima, Perú", desc: "Sede central de operaciones." }
                  ].map((c, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-accent shadow-sm border border-slate-100 shrink-0"><c.icon className="h-6 w-6" /></div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{c.title}</h4>
                        <p className="text-lg font-black text-primary uppercase tracking-tight">{c.val}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-top"></div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-accent animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest">Horario de Atención</span></div>
                    <p className="text-2xl font-black uppercase tracking-tighter">LUN - VIE: 8AM A 6PM</p>
                    <p className="text-[10px] font-bold uppercase opacity-60">Sábados: 9am a 1pm / Soporte técnico 24/7 para planes Empresariales.</p>
                  </div>
                </div>
              </div>

              {/* Form Column */}
              <div className="lg:col-span-7">
                <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-slate-100">
                  <form className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nombre Completo</Label>
                        <Input placeholder="Ej. Carlos Mendoza" className="h-12 border-2 focus:ring-primary rounded-xl font-bold text-xs" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nombre de la Empresa</Label>
                        <Input placeholder="Ej. Seguridad SAC" className="h-12 border-2 focus:ring-primary rounded-xl font-bold text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Correo Corporativo</Label>
                        <Input type="email" placeholder="usuario@empresa.com" className="h-12 border-2 focus:ring-primary rounded-xl font-bold text-xs" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Celular / WhatsApp</Label>
                        <Input placeholder="+51 900 000 000" className="h-12 border-2 focus:ring-primary rounded-xl font-bold text-xs" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Mensaje o Requerimiento Especial</Label>
                      <Textarea placeholder="Cuéntanos sobre el volumen de extintores que manejas..." className="min-h-[150px] border-2 focus:ring-primary rounded-2xl font-bold text-xs leading-relaxed" />
                    </div>

                    <Button className="w-full h-16 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl group rounded-xl">
                      Enviar Solicitud Técnica <Send className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <div className="flex items-center justify-center gap-6 pt-4 grayscale opacity-30">
                      <Shield className="h-6 w-6" />
                      <MessageSquare className="h-6 w-6" />
                      <Zap className="h-6 w-6" />
                    </div>
                  </form>
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
