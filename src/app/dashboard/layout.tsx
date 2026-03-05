
import { DashboardNav } from "@/components/dashboard-nav"
import { Search, User, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar shrink-0 hidden md:block">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex-1 flex items-center max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar clientes, servicios o equipos..." 
                className="pl-10 h-9 bg-background/50 border-input"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center space-x-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">Admin Servifumiga</p>
                <p className="text-[10px] text-muted-foreground uppercase">Coordinador</p>
              </div>
              <div className="h-9 w-9 bg-primary rounded-full flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
