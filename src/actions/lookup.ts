
'use server';

/**
 * @fileOverview Acciones de servidor para consulta de documentos oficiales.
 * Se utiliza el servidor como proxy para evitar errores de CORS en el navegador.
 */

const API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFwZXZhMTk4OUBnbWFpbC5jb20ifQ.LMX5XM-xgVwQvrWSiglrtSFwwYfb2OiFxs3YA8vjVoQ";

export async function lookupTaxId(taxId: string) {
  try {
    const response = await fetch(`https://api.apisperu.com/v1/ruc/${taxId}?token=${API_TOKEN}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache opcional por 1 hora
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en el servidor de consulta");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Lookup RUC Error:", error);
    throw new Error(error.message || "No se pudo conectar con el servicio de consulta.");
  }
}

export async function lookupDni(dni: string) {
  try {
    const response = await fetch(`https://api.apisperu.com/v1/dni/${dni}?token=${API_TOKEN}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en el servidor de consulta");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Lookup DNI Error:", error);
    throw new Error(error.message || "No se pudo conectar con el servicio de consulta.");
  }
}
