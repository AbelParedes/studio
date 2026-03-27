"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Bell, 
  History, 
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  ShieldCheck,
  Building2,
  FileText,
  Package,
  Zap,
  ClipboardList,
  HardDrive,
  Award,
  Wrench
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import Image from "next/image"

const navItems = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { name: "Empresas", href: "/dashboard/companies", icon: Building2, superAdminOnly: true },
  { name: "Clientes", href: "/dashboard/clients", icon: Users },
  { name: "Extintores", href: "/dashboard/equipment", icon: HardDrive },
  { name: "Certificados", href: "/dashboard/certificates", icon: Award },
  { name: "Técnicos", href: "/dashboard/technicians", icon: Wrench },
  { name: "Cotizaciones", href: "/dashboard/quotations", icon: FileText },
  { name: "Órdenes de Servicio", href: "/dashboard/service-orders", icon: ClipboardList },
  { name: "Calendario", href: "/dashboard/calendar", icon: Calendar },
  { name: "Productos", href: "/dashboard/inventory", icon: Package },
  { name: "Recordatorios IA", href: "/dashboard/reminders", icon: Bell },
  { name: "Usuarios", href: "/dashboard/users", icon: UserCheck },
  { name: "Roles y Permisos", href: "/dashboard/roles", icon: ShieldCheck, adminOnly: true },
  { name: "Planes", href: "/dashboard/plans", icon: Zap },
  { name: "Historial", href: "/dashboard/history", icon: History },
  { name: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
]

interface DashboardNavProps {
  onNavItemClick?: () => void
  companyName?: string
  logoUrl?: string | null
  userRole?: string
  isSuperAdmin?: boolean
}

export function DashboardNav({ onNavItemClick, companyName, logoUrl, userRole, isSuperAdmin }: DashboardNavProps) {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const filteredItems = navItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false
    if (item.adminOnly && !isSuperAdmin && userRole !== "Administrador" && userRole !== "Coordinador de Servicios") return false
    return true
  })

  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className="p-6 flex items-center gap-3">
        {logoUrl ? (
          <div className="relative h-10 w-10 bg-white rounded border overflow-hidden shrink-0">
            <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
          </div>
        ) : (
          <div className="h-10 w-10 bg-white/10 rounded flex items-center justify-center shrink-0 border border-white/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-xs font-bold tracking-wider text-white uppercase truncate max-w-[140px]">
            {companyName || "EXTINPRO"}
          </h1>
          <span className="text-[9px] font-bold uppercase text-accent tracking-tighter opacity-80">
            {isSuperAdmin ? "SAAS MASTER CONTROL" : "SISTEMA TÉCNICO"}
          </span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavItemClick}
              className={cn(
                "group flex items-center px-3 py-2 text-[11px] font-bold uppercase transition-colors rounded-md",
                isActive 
                  ? "bg-sidebar-accent text-white shadow-sm" 
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-4 w-4",
                isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-white"
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
          className="group flex items-center px-3 py-2 text-[11px] font-bold uppercase text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <Settings className="mr-3 h-4 w-4" />
          Ajustes
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full group flex items-center px-3 py-2 text-[11px] font-bold uppercase text-sidebar-foreground/60 hover:bg-destructive hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
