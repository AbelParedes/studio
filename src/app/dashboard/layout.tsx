
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { Search, User, Bell, Loader2, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, limit } from "firebase/firestore"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Buscar el perfil del usuario por su correo electrónico
  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email), limit(1)) : null,
  [db, user?.email])
  
  const { data: profiles, isLoading: isLoadingProfile } = useCollection(userProfileQuery)
  const profile = profiles?.[0] || null

  // Obtener la definición del rol usando el roleId del perfil
  const roleRef = useMemoFirebase(() => 
    profile?.roleId ? doc(db, "system_roles", profile.roleId) : null,
  [db, profile?.roleId])

  const { data: roleData } = useDoc(roleRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Validando credenciales...</p>
      </div>
    )
  }

  const displayName = profile?.name || user.email?.split('@')[0] || "Usuario"
  const displayRole = roleData?.title || "Personal Autorizado"

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-sidebar shrink-0 hidden lg:block border-r border-sidebar-border shadow-xl">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none">
                <DashboardNav onNavItemClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="relative w-full max-w-xs sm:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10 h-9 bg-background/50 border-input text-xs"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 hidden sm:flex">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-accent rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>
            <div className="flex items-center space-x-2 sm:space-x-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary uppercase leading-tight max-w-[150px] truncate">
                  {displayName}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                  {displayRole}
                </p>
              </div>
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-primary rounded-full flex items-center justify-center text-white shadow-md uppercase font-bold text-xs border-2 border-accent/20 shrink-0">
                {displayName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
