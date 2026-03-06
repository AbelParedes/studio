
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Building2, Globe, Palette, Trash2, Edit2, Loader2, LogIn } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, doc, query, where, getDocs, updateDoc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function CompaniesPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any | null>(null)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)

  const companiesRef = useMemoFirebase(() => collection(db, "companies"), [db])
  const { data: companies, isLoading } = useCollection(companiesRef)

  const filteredCompanies = companies?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const companyData = {
      name: formData.get("name") as string,
      taxId: formData.get("taxId") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      logoUrl: formData.get("logoUrl") as string,
      primaryColor: formData.get("primaryColor") as string || "#1a2b3c",
      accentColor: formData.get("accentColor") as string || "#d9534f",
      themeMode: formData.get("themeMode") as string || "light",
      updatedAt: new Date().toISOString()
    }

    if (editingCompany) {
      updateDocumentNonBlocking(doc(db, "companies", editingCompany.id), companyData)
      toast({ title: "Empresa actualizada" })
    } else {
      const newId = crypto.randomUUID()
      const newCompany = { ...companyData, id: newId, createdAt: new Date().toISOString() }
      addDocumentNonBlocking(companiesRef, newCompany)
      toast({ title: "Empresa creada" })
    }

    setIsAdding(false)
    setEditingCompany(null)
  }

  // Función para "Entrar" a una empresa como administrador
  const handleSwitchCompany = async (companyId: string) => {
    if (!user?.email) return
    setIsSwitching(companyId)
    
    try {
      const userProfileQuery = query(collection(db, "company_users"), where("email", "==", user.email))
      const snapshot = await getDocs(userProfileQuery)
      
      if (!snapshot.empty) {
        const profileDoc = snapshot.docs[0]
        await updateDoc(doc(db, "company_users", profileDoc.id), { companyId })
        toast({ title: "Cambiando de organización", description: "El dashboard se actualizará con la nueva identidad." })
        window.location.reload() // Recargar para aplicar temas y filtros
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cambiar empresa" })
    } finally {
      setIsSwitching(null)
    }
  }

  const handleDelete = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", id))
    toast({ variant: "destructive", title: "Empresa eliminada" })
  }

  const openEdit = (company: any) => {
    setEditingCompany(company)
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">GESTIÓN DE EMPRESAS</h2>
          <p className="text-muted-foreground text-sm">Administre las organizaciones registradas y acceda a sus paneles exclusivos.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) setEditingCompany(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-9">
              <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSaveCompany}>
              <DialogHeader>
                <DialogTitle>{editingCompany ? "Editar Organización" : "Registrar Nueva Organización"}</DialogTitle>
                <DialogDescription>Defina la identidad y datos fiscales de la nueva empresa.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Comercial</Label>
                    <Input id="name" name="name" defaultValue={editingCompany?.name} required placeholder="Ej. Servifumiga Sur SAC" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxId">RUC / DNI</Label>
                    <Input id="taxId" name="taxId" defaultValue={editingCompany?.taxId} required placeholder="Ej. 20XXXXXXXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Corporativo</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingCompany?.email} required placeholder="admin@empresa.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={editingCompany?.phone} placeholder="+51 987..." />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección Fiscal</Label>
                  <Input id="address" name="address" defaultValue={editingCompany?.address} placeholder="Lima, Perú" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logoUrl">URL del Logo (PNG/SVG)</Label>
                  <Input id="logoUrl" name="logoUrl" defaultValue={editingCompany?.logoUrl} placeholder="https://dominio.com/logo.png" />
                </div>

                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primaryColor">Color Primario</Label>
                    <Input id="primaryColor" name="primaryColor" type="color" defaultValue={editingCompany?.primaryColor || "#1a2b3c"} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="accentColor">Color Acento</Label>
                    <Input id="accentColor" name="accentColor" type="color" defaultValue={editingCompany?.accentColor || "#d9534f"} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="themeMode">Tema inicial</Label>
                    <Select name="themeMode" defaultValue={editingCompany?.themeMode || "light"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full uppercase font-bold text-xs">{editingCompany ? "Actualizar" : "Crear Empresa"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o RUC..." 
              className="pl-9 h-9 text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table">
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Empresa</TableHead>
                  <TableHead className="text-white">Identificación</TableHead>
                  <TableHead className="text-white">Contacto</TableHead>
                  <TableHead className="text-white">Personalización</TableHead>
                  <TableHead className="text-white w-[150px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((comp) => (
                  <TableRow key={comp.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative bg-white border rounded overflow-hidden shrink-0">
                          {comp.logoUrl ? (
                            <Image src={comp.logoUrl} alt="Logo" fill className="object-contain p-1" unoptimized />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary uppercase">{comp.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{comp.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[11px] font-mono bg-muted/50 px-2 py-1 rounded w-fit">
                        {comp.taxId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[11px]">
                        <span className="font-medium">{comp.email}</span>
                        <span className="text-muted-foreground">{comp.phone || "Sin teléfono"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded shadow-sm border" style={{ backgroundColor: comp.primaryColor }}></div>
                        <div className="h-4 w-4 rounded shadow-sm border" style={{ backgroundColor: comp.accentColor }}></div>
                        <Badge variant="outline" className="text-[8px] uppercase font-bold">
                          {comp.themeMode}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold uppercase bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => handleSwitchCompany(comp.id)}
                          disabled={isSwitching === comp.id}
                        >
                          {isSwitching === comp.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="mr-1.5 h-3 w-3" />}
                          Gestionar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(comp)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(comp.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No se encontraron organizaciones registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
