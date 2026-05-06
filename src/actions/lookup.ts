'use server';

/**
 * @fileOverview Acciones de servidor para consulta de documentos oficiales.
 * Se utiliza el servidor como proxy para evitar errores de CORS en el navegador.
 */

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFwZXZhMTk4OUBnbWFpbC5jb20ifQ.LMX5XM-xgVwQvrWSiglrtSFwwYfb2OiFxs3YA8vjVoQ";

/**
 * Realiza una petición fetch segura con headers de navegador para evitar bloqueos.
 */
async function secureFetch(url: string) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
    // Establecer un timeout razonable
    signal: AbortSignal.timeout(10000) 
  });
}

export async function lookupTaxId(taxId: string) {
  if (!taxId || taxId.length !== 11) throw new Error("Número de RUC inválido (debe tener 11 dígitos).");
  const cleanTaxId = taxId.trim();
  
  try {
    const response = await secureFetch(`https://api.apisperu.com/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`);

    if (!response.ok) {
      let errorMsg = "Error en el servidor de consulta";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        errorMsg = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Lookup RUC Error Details:", error);
    
    // Manejo de errores de conexión (DNS, Timeout, Bloqueo de Red)
    if (error.name === 'TimeoutError') {
      throw new Error("La consulta tardó demasiado. Intente nuevamente.");
    }
    
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('undici') || error.message.includes('ENOTFOUND'))) {
      throw new Error("No se pudo establecer conexión con APIs Perú. Es posible que el acceso a internet esté restringido en este entorno o el servicio esté caído.");
    }
    
    throw new Error(error.message || "Error inesperado al conectar con el servicio de consulta.");
  }
}

export async function lookupDni(dni: string) {
  if (!dni || dni.length !== 8) throw new Error("Número de DNI inválido (debe tener 8 dígitos).");
  const cleanDni = dni.trim();
  
  try {
    const response = await secureFetch(`https://api.apisperu.com/v1/dni/${cleanDni}?token=${API_TOKEN}`);

    if (!response.ok) {
      let errorMsg = "Error en el servidor de consulta";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        errorMsg = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Lookup DNI Error Details:", error);
    
    if (error.name === 'TimeoutError') {
      throw new Error("La consulta de DNI tardó demasiado.");
    }

    if (error.message && (error.message.includes('fetch failed') || error.message.includes('undici') || error.message.includes('ENOTFOUND'))) {
      throw new Error("Error de red: No se pudo alcanzar el servidor de RENIEC/APIs Perú.");
    }
    
    throw new Error(error.message || "Error al conectar con el servicio de consulta de DNI.");
  }
}
