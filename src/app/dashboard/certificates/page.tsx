
"use client"

export default function CertificatesRemovedPage() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center opacity-20">
        <span className="text-4xl font-black">!</span>
      </div>
      <h2 className="text-2xl font-black uppercase text-primary tracking-tighter">Módulo Deshabilitado</h2>
      <p className="text-muted-foreground text-sm uppercase font-bold max-w-md">
        Este módulo ha sido retirado del sistema. Por favor, gestione sus protocolos directamente desde las Órdenes de Servicio o el Historial.
      </p>
    </div>
  )
}
