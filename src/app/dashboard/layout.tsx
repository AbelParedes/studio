
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Bell, Loader2, Menu, Building2, Clock, ShieldAlert, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from "@/firebase"
import { doc, collection, query, where, limit } from "firebase/firestore"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOut } from "firebase/auth"
import Image from "next/image"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // User profile
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  
  const { data: profiles, isLoading: isLoadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0] || null

  // Company data
  const companyRef = useMemoFirebase(() => 
    profile?.companyId ? doc(db, "companies", profile.companyId) : null,
  [db, profile?.companyId])
  const { data: company, isLoading: loadingCompany } = useDoc(companyRef)

  // Role data
  const roleRef = useMemoFirebase(() => 
    profile?.roleId ? doc(db, "system_roles", profile.roleId) : null,
  [db, profile?.roleId])
  const { data: roleData } = useDoc(roleRef)

  const isMasterAdmin = roleData?.title === "Administrador"

  // Dynamic theme and colors
  useEffect(() => {
    if (company && company.status === "Active") {
      if (company.themeMode === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      if (company.primaryColor) {
        document.documentElement.style.setProperty('--primary', hexToHsl(company.primaryColor))
      }
      if (company.accentColor) {
        document.documentElement.style.setProperty('--accent', hexToHsl(company.accentColor))
      }
    } else {
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
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Sincronizando Entorno SaaS...</p>
      </div>
    )
  }

  // Pending approval screen
  if (!isMasterAdmin && (profile?.status === "Pending" || company?.status === "Pending")) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10 text-center border-t-8 border-t-primary">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-primary mb-4">Acceso en Verificación</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 font-medium">
            Hola, <span className="text-primary font-bold">{profile?.name}</span>. Tu cuenta y la organización <span className="text-primary font-bold">{company?.name || "solicitada"}</span> están siendo revisadas por nuestro equipo de soporte maestro.
          </p>
          <div className="p-4 bg-muted/30 rounded-lg text-[11px] text-muted-foreground uppercase font-bold mb-8 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-accent shrink-0" />
            Recibirás un correo una vez que tu entorno SaaS sea activado.
          </div>
          <Button 
            variant="outline" 
            className="w-full font-bold uppercase text-xs h-11 border-primary text-primary"
            onClick={() => signOut(auth).then(() => router.push("/login"))}
          >
            <LogOut className="mr-2 h-4 w-4" /> Salir del Sistema
          </Button>
        </div>
      </div>
    )
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || "Usuario"
  const displayRole = roleData?.title || "Colaborador"
  const companyLogo = company?.logoUrl || null
  const companyName = company?.name || "SERVIFUMIGA PRO"

  return (
    <div className="flex h-screen bg-background dark:bg-slate-950 overflow-hidden text-foreground">
      <aside className="w-64 bg-sidebar shrink-0 hidden lg:block border-r border-sidebar-border shadow-xl">
        <DashboardNav 
          companyName={companyName} 
          logoUrl={companyLogo} 
          userRole={displayRole}
        />
      </aside>

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
                  companyName={companyName} 
                  logoUrl={companyLogo} 
                  userRole={displayRole}
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              {companyLogo ? (
                <div className="relative h-8 w-8 rounded overflow-hidden border bg-white shadow-sm">
                  <Image src={companyLogo} alt="Logo" fill className="object-contain p-1" unoptimized />
                </div>
              ) : (
                <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center border border-primary/20">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="text-xs font-bold uppercase hidden sm:block truncate max-w-[300px] tracking-tight text-primary">
                {companyName}
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
                {displayName[0] || "U"}
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
