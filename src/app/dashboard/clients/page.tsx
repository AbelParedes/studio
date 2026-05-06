"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MapPin, Phone, Mail, Trash2, Edit2, Loader2, Building2, User, FileText, MessageSquare, UserPlus, Users } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useUser } from "@/firebase"
import { collection, doc, query, where } from "firebase/firestore"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { lookupTaxId, lookupDni } from "@/actions/lookup"

export default function ClientsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isConsulting, setIsConsulting] = useState(false)
  const [editingClient, setEditingUser] = useState<any | null>(null)
  const [clientType, setClientType] = useState<"Empresa" | "Persona">("Empresa")
  
  // States for controlled inputs during lookup
  const [taxId, setTaxId] = useState("")
  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [address, setAddress] = useState("")

  const userProfileQuery = useMemoFirebase(() => 
    user?.email ? query(collection(db, "company_users"), where("email", "==", user.email)) : null,
  [db, user?.email])
  const { data: profiles } = useCollection(userProfileQuery)
  const companyId = profiles?.[0]?.companyId

  const clientsRef = useMemoFirebase(() => 
    companyId ? query(collection(db, "clients"), where("companyId", "==", companyId)) : null,
  [db, companyId])
  const { data: clients, isLoading } = useCollection(clientsRef)

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))

  const handleConsultTaxId = async () => {
    if (!taxId || (clientType === "Empresa" && taxId.length !== 11) || (clientType === "Persona" && taxId.length !== 8)) {
      toast({ 
        variant: "destructive", 
        title: "Documento inválido", 
        description: `Ingrese ${clientType === "Empresa" ? '11 dígitos para RUC' : '8 dígitos para DNI'}.` 
      })
      return
    }

    setIsConsulting(true)
    
    try {
      const data = clientType === "Empresa" 
        ? await lookupTaxId(taxId)
        : await lookupDni(taxId)

      if (data) {
        if (clientType === "Empresa") {
          const mainName = data.nombreComercial && data.nombreComercial !== "-" ? data.nombreComercial : data.razonSocial
          setName(mainName.toUpperCase())
          setLegalName(data.razonSocial.toUpperCase())
          setAddress((data.direccion || "").toUpperCase())
        } else {
          // Reconstruir nombre completo desde campos individuales o campo único
          const fullName = data.nombre || `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim()
          setName(fullName.toUpperCase())
          setAddress((data.direccion || "").toUpperCase())
          setLegalName("")
        }
        toast({ title: "Datos obtenidos", description: "Información recuperada de registros oficiales." })
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Consulta Fallida", 
        description: error.message || "No se pudo recuperar la información." 
      })
    } finally {
      setIsConsulting(false)
    }
  }

  const handleSaveClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!companyId) return

    const formData = new FormData(e.currentTarget)
    const clientData = {
      companyId: companyId,
      clientType: clientType,
      taxId: taxId,
      name: name,
      legalName: legalName,
      industry: formData.get("industry") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: address,
      contactPerson: {
        name: formData.get("contactName") as string,
        position: formData.get("contactPosition") as string,
        phone: formData.get("contactPhone") as string,
      },
      notes: formData.get("notes") as string,
      updatedAt: new Date().toISOString()
    }

    if (editingClient) {
      updateDocumentNonBlocking(doc(db, "clients", editingClient.id), clientData)
      toast({ title: "Cliente actualizado" })
    } else {
      const newClient = { ...clientData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      addDocumentNonBlocking(collection(db, "clients"), newClient)
      toast({ title: "Cliente registrado" })
    }

    resetForm()
  }

  const resetForm = () => {
    setIsAdding(false)
    setEditingUser(null)
    setTaxId("")
    setName("")
    setLegalName("")
    setAddress("")
  }

  const handleDeleteClient = (id: string) => {
    if(!confirm("¿Eliminar expediente de cliente?")) return
    deleteDocumentNonBlocking(doc(db, "clients", id))
    toast({ variant: "destructive", title: "Cliente eliminado" })
  }

  const openEdit = (client: any) => {
    setEditingUser(client)
    setClientType(client.clientType)
    setTaxId(client.taxId || "")
    setName(client.name || "")
    setLegalName(client.legalName || "")
    setAddress(client.address || "")
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 uppercase text-primary">Cartera de Clientes</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Base de datos técnica para facturación y servicios.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={(open) => { if (!open) resetForm(); else setIsAdding(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white h-10 font-bold uppercase text-xs shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
            <form onSubmit={handleSaveClient}>
              <DialogHeader className="p-6 bg-slate-50 border-b">
                <DialogTitle className="uppercase font-black text-primary">Expediente de Cliente</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase">Registro oficial para la gestión técnica de extintores.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Tipo de Contribuyente</Label>
                    <Select value={clientType} onValueChange={(val: any) => { setClientType(val); resetForm(); setIsAdding(true); setClientType(val); }} required>
                      <SelectTrigger className="h-11 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Empresa" className="font-bold">Jurídica (RUC)</SelectItem>
                        <SelectItem value="Persona" className="font-bold">Natural (DNI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">{clientType === "Empresa" ? "RUC" : "DNI"}</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={taxId} 
                        onChange={(e) => setTaxId(e.target.value)} 
                        required 
                        placeholder={clientType === "Empresa" ? "20XXXXXXXXX" : "7XXXXXXX"} 
                        className="h-11 border-2 font-mono font-bold" 
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="h-11 px-4 bg-accent text-white font-black uppercase text-[10px]"
                        onClick={handleConsultTaxId}
                        disabled={isConsulting}
                      >
                        {isConsulting ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
                        Consultar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">{clientType === "Persona" ? "Nombre Completo" : "Nombre Comercial"}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 border-2 font-bold text-xs uppercase" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Razón Social (Si aplica)</Label>
                    <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="h-11 border-2 font-bold text-xs uppercase" disabled={clientType === "Persona"} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Giro / Industria</Label>
                    <Input name="industry" defaultValue={editingClient?.industry} placeholder="Ej. Minería, Retail, Almacén" className="h-11 border-2 font-bold text-xs uppercase" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Teléfono Central</Label>
                    <Input name="phone" defaultValue={editingClient?.phone} required className="h-11 border-2 font-bold text-xs" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Email Principal para Notificaciones</Label>
                  <Input name="email" defaultValue={editingClient?.email} type="email" required className="h-11 border-2 font-bold text-xs" />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Dirección de Sede / Oficina</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required className="h-11 border-2 font-bold text-xs uppercase" />
                </div>

                <Separator />
                <div className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Users className="h-4 w-4" /> Persona de Contacto Directo
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Nombre</Label>
                    <Input name="contactName" defaultValue={editingClient?.contactPerson?.name} className="h-11 border-2 font-bold text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Cargo</Label>
                    <Input name="contactPosition" defaultValue={editingClient?.contactPerson?.position} className="h-11 border-2 font-bold text-xs" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Celular / WhatsApp</Label>
                    <Input name="contactPhone" defaultValue={editingClient?.contactPerson?.phone} className="h-11 border-2 font-bold text-xs" />
                  </div>
                </div>

                <Separator />
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Observaciones Técnicas del Cliente</Label>
                  <Textarea name="notes" defaultValue={editingClient?.notes} className="min-h-[100px] border-2 font-medium text-xs uppercase" />
                </div>
              </div>
              <DialogFooter className="p-6 bg-slate-50 border-t">
                <Button type="submit" className="w-full h-12 bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl">
                  {editingClient ? "Actualizar Expediente" : "Crear Expediente Industrial"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-none overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, RUC o email..." 
              className="pl-9 h-10 text-xs font-bold uppercase" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-32">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="dense-table min-w-[1000px]">
              <TableHeader className="bg-[#1c1c1c]">
                <TableRow className="border-none">
                  <TableHead className="text-white font-black uppercase text-[10px] py-4">Identidad Fiscal</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Nombre / Empresa</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Contacto Técnico</TableHead>
                  <TableHead className="text-white font-black uppercase text-[10px]">Ubicación</TableHead>
                  <TableHead className="text-white text-right pr-8 font-black uppercase text-[10px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn(
                          "text-[9px] uppercase font-black w-fit",
                          client.clientType === "Empresa" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"
                        )}>
                          {client.clientType}
                        </Badge>
                        <span className="font-mono text-[10px] font-black text-primary">{client.taxId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary uppercase text-[11px] leading-tight mb-1">{client.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{client.industry || "General"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] font-bold">
                        <span className="text-slate-700 uppercase">{client.contactPerson?.name || "Sin contacto"}</span>
                        <span className="text-slate-400 font-medium">{client.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase max-w-[250px] truncate">
                        <MapPin className="h-3 w-3 mr-1.5 shrink-0 text-accent" />
                        {client.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => openEdit(client)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/5"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredClients?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-32 opacity-20">
                      <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">No hay clientes registrados</p>
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