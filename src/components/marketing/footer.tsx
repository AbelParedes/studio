
import Link from "next/link"
import { Flame, MapPin, Phone, Mail, Globe, Facebook, Linkedin, Instagram, ShieldCheck } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1c1c1c] text-white pt-20 pb-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-top pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-lg">
                <Flame className="h-6 w-6 text-accent" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">
                EXTIN<span className="text-accent">PRO</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 font-medium leading-relaxed uppercase">
              La plataforma definitiva para empresas de seguridad contra incendios en Perú. Digitalizamos tus procesos bajo normativa NTP.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent transition-colors"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent transition-colors"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-accent">Navegación</h3>
            <ul className="space-y-4">
              <li><Link href="/nosotros" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link href="/productos" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Módulos</Link></li>
              <li><Link href="/servicios" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Servicios</Link></li>
              <li><Link href="/precios" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Planes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-accent">Legal</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="#" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Políticas de Privacidad</Link></li>
              <li><Link href="#" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Libro de Reclamaciones</Link></li>
              <li><Link href="#" className="text-[10px] font-bold uppercase text-slate-300 hover:text-white transition-colors">Normativa NTP 350.043</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-accent">Contacto</h3>
            <ul className="space-y-4 text-[10px] font-bold uppercase text-slate-300">
              <li className="flex items-start gap-3"><MapPin className="h-4 w-4 text-accent shrink-0" /> Lima, Perú - Oficina Central</li>
              <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-accent shrink-0" /> +51 918 790 212</li>
              <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-accent shrink-0" /> ventas@extinpro.pe</li>
              <li className="flex items-center gap-3"><Globe className="h-4 w-4 text-accent shrink-0" /> www.extinpro.pe</li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            © 2024 EXTINPRO Technical Suite. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <ShieldCheck className="h-4 w-4 text-status-success" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Seguridad Certificada ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
