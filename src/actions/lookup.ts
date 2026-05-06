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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000) // 15 segundos de timeout
  });
}

export async function lookupTaxId(taxId: string) {
  if (!taxId || taxId.length !== 11) throw new Error("Número de RUC inválido (debe tener 11 dígitos).");
  const cleanTaxId = taxId.trim();
  
  try {
    const url = `https://dniruc.apisperu.com/api/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`;
    const response = await secureFetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("RUC no encontrado en los registros oficiales.");
      if (response.status === 401) throw new Error("Token de API inválido o expirado.");
      throw new Error(`Error del servicio externo (${response.status})`);
    }

    const data = await response.json();
    
    // Si la API devuelve success: false o mensaje de error
    if (data.success === false || data.message === "No se encontraron resultados.") {
      throw new Error(data.message || "RUC no encontrado.");
    }

    return data;
  } catch (error: any) {
    console.error("LOG SERVIDOR - ERROR RUC:", error.message);
    
    if (error.name === 'TimeoutError') throw new Error("La consulta tardó demasiado. Intente nuevamente.");
    
    const isNetworkError = error.message.toLowerCase().includes('fetch failed') || 
                          error.message.toLowerCase().includes('undici') || 
                          error.message.toLowerCase().includes('enotfound');

    if (isNetworkError) {
      throw new Error("ERROR DE RED: No se pudo alcanzar el servidor de SUNAT. Verifique la conexión del servidor.");
    }
    
    throw new Error(error.message || "Error inesperado al consultar RUC.");
  }
}

export async function lookupDni(dni: string) {
  if (!dni || dni.length !== 8) throw new Error("Número de DNI inválido (debe tener 8 dígitos).");
  const cleanDni = dni.trim();
  
  try {
    const url = `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${API_TOKEN}`;
    const response = await secureFetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("DNI no encontrado.");
      throw new Error(`Error en servidor de DNI (${response.status})`);
    }

    const data = await response.json();
    console.log("LOG SERVIDOR - RESPUESTA DNI:", JSON.stringify(data));

    // La API de apisperu a veces devuelve success: false o mensajes específicos
    if (data.success === false || data.message === "No se encontraron resultados.") {
      throw new Error(data.message || "El número de DNI no existe o no devolvió datos.");
    }

    // Verificar si tenemos datos mínimos
    if (!data.nombres && !data.nombre) {
      throw new Error("La consulta no devolvió información legible para este DNI.");
    }

    return data;
  } catch (error: any) {
    console.error("LOG SERVIDOR - ERROR DNI:", error.message);
    
    if (error.message.toLowerCase().includes('fetch failed') || error.message.toLowerCase().includes('enotfound')) {
      throw new Error("ERROR DE RED: El servidor no tiene acceso a internet para consultar RENIEC.");
    }
    
    throw new Error(error.message || "Error al conectar con el servicio de DNI.");
  }
}