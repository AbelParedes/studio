'use server';

/**
 * @fileOverview Acciones de servidor para consulta de documentos oficiales.
 * Se utiliza el servidor como proxy para evitar errores de CORS en el navegador.
 */

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFwZXZhMTk4OUBnbWFpbC5jb20ifQ.LMX5XM-xgVwQvrWSiglrtSFwwYfb2OiFxs3YA8vjVoQ";

/**
 * Realiza una petición fetch segura con headers mínimos para evitar bloqueos.
 */
async function secureFetch(url: string) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      // Algunas redes bloquean User-Agents específicos, usamos uno estándar de navegador
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
    // Timeout de 10 segundos
    signal: AbortSignal.timeout(10000) 
  });
}

export async function lookupTaxId(taxId: string) {
  if (!taxId || taxId.length !== 11) throw new Error("Número de RUC inválido (debe tener 11 dígitos).");
  const cleanTaxId = taxId.trim();
  
  try {
    // Usando el nuevo endpoint dniruc.apisperu.com proporcionado
    const response = await secureFetch(`https://dniruc.apisperu.com/api/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`);

    if (!response.ok) {
      if (response.status === 404) throw new Error("RUC no encontrado en los registros oficiales.");
      if (response.status === 401) throw new Error("Token de API inválido o expirado.");
      
      let errorMsg = "Error en el servicio de consulta";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        errorMsg = `Error del servidor (${response.status})`;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error: any) {
    console.error("DETALLE ERROR RUC:", error.message);
    
    // Identificar errores de conectividad del entorno
    if (error.name === 'TimeoutError') {
      throw new Error("La consulta tardó demasiado. El servicio externo podría estar lento.");
    }
    
    // Si falla el fetch por red (ENOTFOUND, EAI_AGAIN, etc)
    const isNetworkError = error.message.toLowerCase().includes('fetch failed') || 
                          error.message.toLowerCase().includes('undici') || 
                          error.message.toLowerCase().includes('enotfound');

    if (isNetworkError) {
      throw new Error("ERROR DE RED: El servidor no tiene acceso a internet para consultar dniruc.apisperu.com. Por favor, verifique las restricciones de red de su entorno o intente más tarde.");
    }
    
    throw new Error(error.message || "Error inesperado al conectar con el servicio de consulta.");
  }
}

export async function lookupDni(dni: string) {
  if (!dni || dni.length !== 8) throw new Error("Número de DNI inválido (debe tener 8 dígitos).");
  const cleanDni = dni.trim();
  
  try {
    // Usando el nuevo endpoint dniruc.apisperu.com proporcionado
    const response = await secureFetch(`https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${API_TOKEN}`);

    if (!response.ok) {
      if (response.status === 404) throw new Error("DNI no encontrado.");
      throw new Error("Error en el servidor de consulta de DNI.");
    }

    return await response.json();
  } catch (error: any) {
    console.error("DETALLE ERROR DNI:", error.message);
    
    if (error.message.toLowerCase().includes('fetch failed') || error.message.toLowerCase().includes('enotfound')) {
      throw new Error("ERROR DE RED: No se pudo alcanzar el servidor de RENIEC. El entorno podría tener el acceso a internet restringido.");
    }
    
    throw new Error(error.message || "Error al conectar con el servicio de consulta de DNI.");
  }
}
