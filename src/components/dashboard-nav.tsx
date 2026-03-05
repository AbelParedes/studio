
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Inventario", href: "/dashboard/inventory", icon: Flame },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Fumigación", href: "/dashboard/fumigation", icon: Bug },
  { name: "Recordatorios AI", href: "/dashboard/reminders", icon: Bell },
  { name: "Historial", href: "/dashboard/history", icon: History },
  { name: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-wider text-white">SERVIFUMIGA <span className="text-accent">PRO</span></h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-white" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5",
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
          className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <Settings className="mr-3 h-5 w-5" />
          Ajustes
        </Link>
        <button
          className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
