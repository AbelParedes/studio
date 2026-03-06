"use client"

import { useEffect } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Search, User, Bell, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser, useAuth, initiateAnonymousSignIn } from "@/firebase"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const auth = useAuth()

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth)
    }
  }, [user, isUserLoading, auth])

  if (isUserLoading || !user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Iniciando Servifumiga Pro Perú...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar shrink-0 hidden md:block border-r border-sidebar-border shadow-xl">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex-1 flex items-center max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar clientes, servicios o equipos..." 
                className="pl-10 h-9 bg-background/50 border-input text-xs"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-accent rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center space-x-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary uppercase leading-tight">Admin Perú</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Coordinador Operativo</p>
              </div>
              <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center text-white shadow-md">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
