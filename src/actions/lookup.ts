'use server';

/**
 * @fileOverview Acciones de servidor para consulta de documentos oficiales.
 * Se utiliza el servidor como proxy para evitar errores de CORS en el navegador.
 */

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFwZXZhMTk4OUBnbWFpbC5jb20ifQ.LMX5XM-xgVwQvrWSiglrtSFwwYfb2OiFxs3YA8vjVoQ";

export async function lookupTaxId(taxId: string) {
  if (!taxId) throw new Error("Número de RUC no proporcionado.");
  const cleanTaxId = taxId.trim();
  
  try {
    const response = await fetch(`https://api.apisperu.com/v1/ruc/${cleanTaxId}?token=${API_TOKEN}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

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
    console.error("Lookup RUC Error:", error);
    // Manejar específicamente el error de conexión fallida (común en entornos cloud)
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('undici'))) {
      throw new Error("No se pudo establecer conexión con el proveedor de datos (APIs Perú). Verifique su conexión o intente nuevamente.");
    }
    throw new Error(error.message || "No se pudo conectar con el servicio de consulta.");
  }
}

export async function lookupDni(dni: string) {
  if (!dni) throw new Error("Número de DNI no proporcionado.");
  const cleanDni = dni.trim();
  
  try {
    const response = await fetch(`https://api.apisperu.com/v1/dni/${cleanDni}?token=${API_TOKEN}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

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
    console.error("Lookup DNI Error:", error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('undici'))) {
      throw new Error("No se pudo establecer conexión con el proveedor de datos (APIs Perú). Verifique su conexión o intente nuevamente.");
    }
    throw new Error(error.message || "No se pudo conectar con el servicio de consulta.");
  }
}
