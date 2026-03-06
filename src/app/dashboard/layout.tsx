
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Search, Bell, Loader2, Menu, Building2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, limit } from "firebase/firestore"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Perfil del usuario para obtener companyId
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  
  const { data: profiles, isLoading: isLoadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0] || null

  // Datos de la Empresa vinculada al perfil
  const companyRef = useMemoFirebase(() => 
    profile?.companyId ? doc(db, "companies", profile.companyId) : null,
  [db, profile?.companyId])
  const { data: company, isLoading: loadingCompany } = useDoc(companyRef)

  // Datos del Rol para el badge del usuario
  const roleRef = useMemoFirebase(() => 
    profile?.roleId ? doc(db, "system_roles", profile.roleId) : null,
  [db, profile?.roleId])
  const { data: roleData } = useDoc(roleRef)

  // Aplicar Tema y Colores dinámicamente
  useEffect(() => {
    if (company) {
      // Aplicar Clase Dark Mode al documento
      if (company.themeMode === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Inyectar variables de color HSL
      if (company.primaryColor) {
        document.documentElement.style.setProperty('--primary', hexToHsl(company.primaryColor))
      }
      if (company.accentColor) {
        document.documentElement.style.setProperty('--accent', hexToHsl(company.accentColor))
      }
    } else {
      // Valores por defecto si no hay empresa cargada
      document.documentElement.classList.remove('dark')
    }
  }, [company])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isLoadingProfile || (profile && loadingCompany)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Iniciando sesión segura...</p>
      </div>
    )
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || "Usuario"
  const displayRole = roleData?.title || "Colaborador"
  const companyLogo = company?.logoUrl || null

  return (
    <div className="flex h-screen bg-background dark:bg-slate-950 overflow-hidden text-foreground">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-sidebar shrink-0 hidden lg:block border-r border-sidebar-border shadow-xl">
        <DashboardNav 
          companyName={company?.name || "SERVIFUMIGA"} 
          logoUrl={companyLogo} 
          userRole={displayRole}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none">
                <DashboardNav 
                  onNavItemClick={() => setIsMobileMenuOpen(false)} 
                  companyName={company?.name || "SERVIFUMIGA"} 
                  logoUrl={companyLogo} 
                  userRole={displayRole}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              {companyLogo ? (
                <div className="relative h-8 w-8 rounded overflow-hidden border bg-white">
                  <Image src={companyLogo} alt="Logo" fill className="object-contain p-1" unoptimized />
                </div>
              ) : (
                <Building2 className="h-5 w-5 text-primary" />
              )}
              <span className="text-xs font-bold uppercase hidden sm:block truncate max-w-[200px]">
                {company?.name || "Panel de Control"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 hidden sm:flex">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-accent rounded-full border-2 border-white dark:border-slate-900"></span>
            </Button>
            <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>
            <div className="flex items-center space-x-2 sm:space-x-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary uppercase leading-tight truncate max-w-[150px]">
                  {displayName}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold">
                  {displayRole}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-primary rounded-full flex items-center justify-center text-white shadow-md uppercase font-bold text-xs border-2 border-accent/20">
                {displayName[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc] dark:bg-slate-950/50">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Convierte un color HEX a una cadena HSL compatible con las variables de Tailwind (H S L).
 */
function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
