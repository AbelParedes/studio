
"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Flame, Menu, X, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"

export function Header() {
  const { user } = useUser()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Productos", href: "/productos" },
    { name: "Servicios", href: "/servicios" },
    { name: "Precios", href: "/precios" },
    { name: "Contacto", href: "/contacto" },
  ]

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300 border-b",
      isScrolled ? "bg-white/95 backdrop-blur-md py-3 shadow-md border-slate-200" : "bg-transparent py-5 border-transparent"
    )}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg shadow-lg">
            <Flame className="h-6 w-6 text-accent" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase text-primary">
            EXTIN<span className="text-accent">PRO</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-accent transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button className="bg-primary text-white h-10 font-bold uppercase text-[10px] px-6 shadow-xl">
                Panel de Control
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-primary font-bold uppercase text-[10px]">
                  Ingresar
                </Button>
              </Link>
              <Link href="/login?mode=register">
                <Button className="bg-accent text-white h-10 font-bold uppercase text-[10px] px-6 shadow-xl hover:bg-accent/90">
                  Prueba Gratis
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs font-black uppercase tracking-widest text-primary py-2 border-b border-slate-50"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full font-bold uppercase text-[10px] border-2">Ingresar</Button>
              </Link>
              <Link href="/login?mode=register" className="w-full">
                <Button className="w-full bg-accent text-white font-bold uppercase text-[10px]">Empezar Ahora</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
