
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Flame, 
  Bug, 
  Bell, 
  History, 
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  ShieldCheck,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import Image from "next/image"

const navItems = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Usuarios", href: "/dashboard/users", icon: UserCheck },
  { name: "Roles y Permisos", href: "/dashboard/roles", icon: ShieldCheck },
  { name: "Inventario", href: "/dashboard/inventory", icon: Flame },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Fumigación", href: "/dashboard/fumigation", icon: Bug },
  { name: "Recordatorios AI", href: "/dashboard/reminders", icon: Bell },
  { name: "Historial", href: "/dashboard/history", icon: History },
  { name: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
]

interface DashboardNavProps {
  onNavItemClick?: () => void
  companyName?: string
  logoUrl?: string | null
}

export function DashboardNav({ onNavItemClick, companyName, logoUrl }: DashboardNavProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 flex items-center gap-3">
        {logoUrl ? (
          <div className="relative h-10 w-10 bg-white rounded border overflow-hidden">
            <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
          </div>
        ) : (
          <div className="h-10 w-10 bg-white/10 rounded flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-wider text-white uppercase truncate max-w-[140px]">
            {companyName || "PRO" }
          </h1>
          <span className="text-[9px] font-bold uppercase text-accent tracking-tighter opacity-80">
            {logoUrl ? "ORGANIZACIÓN" : "SISTEMA PRO"}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavItemClick}
              className={cn(
                "group flex items-center px-3 py-2 text-[12px] font-bold uppercase transition-colors rounded-md",
                isActive 
                  ? "bg-sidebar-accent text-white" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-4 w-4",
                isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          href="/dashboard/settings"
          onClick={onNavItemClick}
          className="group flex items-center px-3 py-2 text-[12px] font-bold uppercase text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <Settings className="mr-3 h-4 w-4" />
          Ajustes
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full group flex items-center px-3 py-2 text-[12px] font-bold uppercase text-sidebar-foreground/70 hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
