'use server';

/**
 * @fileOverview Acciones de servidor para consulta de documentos oficiales (SUNAT/RENIEC).
 * Se utiliza el servidor como proxy para evitar errores de CORS y proteger el API Token.
 */

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFwZXZhMTk4OUBnbWFpbC5jb20ifQ.LMX5XM-xgVwQvrWSiglrtSFwwYfb2OiFxs3YA8vjVoQ";

/**
 * Realiza una petición fetch segura con headers mínimos y manejo de tiempo de espera.
 */
async function secureFetch(url: string) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12000) // 12 segundos de timeout
  });
}

export async function lookupTaxId(taxId: string) {
  if (!taxId || taxId.trim().length !== 11) throw new Error("El RUC debe tener 11 dígitos.");
  const cleanTaxId = taxId.trim();
  
  try {
    const url = `https://dniruc.apisperu.com/api/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`;
    const response = await secureFetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("RUC no encontrado en SUNAT.");
      if (response.status === 401) throw new Error("Error de autenticación con el proveedor (Token inválido).");
      if (response.status === 429) throw new Error("Límite de consultas excedido. Intente en unos minutos.");
      throw new Error(`Error del servicio externo (${response.status})`);
    }

    const rawData = await response.json();
    console.log(`LOG SERVIDOR - CONSULTA RUC [${cleanTaxId}]:`, JSON.stringify(rawData));
    
    // Normalizar respuesta (algunas APIs devuelven los datos dentro de .data)
    const data = rawData.data || rawData;
    
    if (data.success === false || data.message === "No se encontraron resultados.") {
      throw new Error(data.message || "RUC no encontrado en los registros oficiales.");
    }

    if (!data.razonSocial && !data.nombre) {
      throw new Error("La consulta no devolvió datos legibles. Verifique el número.");
    }

    return data;
  } catch (error: any) {
    console.error("ERROR RUC SERVER ACTION:", error.message);
    
    if (error.name === 'TimeoutError') throw new Error("La consulta de SUNAT tardó demasiado. Intente nuevamente.");
    
    const isNetworkError = error.message.toLowerCase().includes('fetch failed') || 
                          error.message.toLowerCase().includes('enotfound');

    if (isNetworkError) {
      throw new Error("Error de Red: El servidor no pudo alcanzar a SUNAT. Intente de nuevo en un momento.");
    }
    
    throw new Error(error.message || "Ocurrió un error inesperado al consultar el RUC.");
  }
}

export async function lookupDni(dni: string) {
  if (!dni || dni.trim().length !== 8) throw new Error("El DNI debe tener 8 dígitos.");
  const cleanDni = dni.trim();
  
  try {
    const url = `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${API_TOKEN}`;
    const response = await secureFetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("DNI no encontrado en RENIEC.");
      throw new Error(`Error en servidor de DNI (${response.status})`);
    }

    const rawData = await response.json();
    console.log(`LOG SERVIDOR - CONSULTA DNI [${cleanDni}]:`, JSON.stringify(rawData));

    // Normalizar respuesta (APIs Perú puede devolver la data directa o en un objeto data)
    const data = rawData.data || rawData;

    // Si la API devuelve éxito falso o mensaje de no encontrado
    if (data.success === false || data.message === "No se encontraron resultados.") {
      throw new Error("DNI no encontrado. Verifique el número o intente más tarde si es un documento reciente.");
    }

    // Verificar si tenemos nombres o nombre completo
    const hasName = data.nombres || data.nombre || data.nombreCompleto;
    if (!hasName) {
      throw new Error("RENIEC no devolvió información para este DNI en este momento.");
    }

    return data;
  } catch (error: any) {
    console.error("ERROR DNI SERVER ACTION:", error.message);
    
    if (error.name === 'TimeoutError') throw new Error("Tiempo de espera agotado al conectar con RENIEC.");

    if (error.message.toLowerCase().includes('fetch failed')) {
      throw new Error("Falla de conexión con el padrón electoral. Intente nuevamente.");
    }
    
    throw new Error(error.message || "Error al procesar la consulta de DNI.");
  }
}
