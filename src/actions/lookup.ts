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
    signal: AbortSignal.timeout(15000) // 15 segundos de timeout
  });
}

export async function lookupTaxId(taxId: string) {
  if (!taxId || taxId.trim().length !== 11) throw new Error("El RUC debe tener 11 dígitos.");
  const cleanTaxId = taxId.trim();
  
  try {
    const url = `https://dniruc.apisperu.com/api/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`;
    const response = await secureFetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("RUC no encontrado en los registros oficiales.");
      if (response.status === 401) throw new Error("Token de API inválido o expirado.");
      throw new Error(`Error del servicio externo (${response.status})`);
    }

    const rawData = await response.json();
    console.log(`LOG SERVIDOR - CONSULTA RUC [${cleanTaxId}]:`, JSON.stringify(rawData));
    
    const data = rawData.data || rawData;
    
    if (data.success === false) {
      throw new Error(data.message || "RUC no encontrado.");
    }

    return data;
  } catch (error: any) {
    if (error.name === 'TimeoutError') throw new Error("La consulta de SUNAT tardó demasiado. Reintente.");
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
      throw new Error(`Error en servidor de identidad (${response.status})`);
    }

    const rawData = await response.json();
    console.log(`LOG SERVIDOR - CONSULTA DNI [${cleanDni}]:`, JSON.stringify(rawData));

    const data = rawData.data || rawData;

    // Solo lanzamos error si success es explícitamente false Y no hay datos de nombre
    if (data.success === false && !data.nombre && !data.nombres && !data.nombreCompleto) {
      throw new Error(data.message || "DNI no encontrado en RENIEC.");
    }

    // Si el mensaje es "No se encontraron resultados" pero el API devolvió un 200, 
    // verificamos si hay algún campo de nombre antes de rendirnos.
    const hasName = data.nombreCompleto || data.nombre || data.nombres || data.nombre_completo;
    
    if (!hasName && data.message === "No se encontraron resultados.") {
      throw new Error("RENIEC no devolvió información para este número. Verifique el DNI.");
    }

    return data;
  } catch (error: any) {
    if (error.name === 'TimeoutError') throw new Error("Tiempo de espera agotado al conectar con RENIEC.");
    throw new Error(error.message || "Error al procesar la consulta de DNI.");
  }
}
