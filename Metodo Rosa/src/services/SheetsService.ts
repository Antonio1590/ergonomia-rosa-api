/* =========================================================
   CONFIGURACIÓN — pegar la URL del Apps Script desplegado
========================================================= */

const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL ?? "";


/* =========================================================
   TIPOS
========================================================= */

export interface AppUser {
  cedula: string;
  email: string;
  nombre: string;
  rol: "admin" | "user";
  fechaRegistro: string;
}

// Columnas hoja "Registros": Fecha|Email|TotalROSA|NivelRiesgo|Postura|URLImagen|Detalles|Recomendaciones|Neck|Trunk|Legs|Arms|Wrist
export interface EvaluationRecord {
  fecha: string;
  email: string;
  puntajeFinal: number;
  nivelRiesgo: string;
  postura?: string;
  urlImagen?: string;
  detalles?: string;
  recomendaciones: string;
  neck?: number | string;
  trunk?: number | string;
  legs?: number | string;
  arms?: number | string;
  wrist?: number | string;
  // campos derivados que devuelve Apps Script al listar evaluaciones
  nombre?: string;
  cedula?: string;
  // Al guardar: el servidor (Sheets.gs) arma la columna "Detalles" a partir
  // de estos 4 campos — no leas/escribas "detalles" directamente.
  // Al listar: el servidor solo devuelve "detalles" (JSON string); usa
  // parseDetalles() más abajo para extraer estos mismos valores de vuelta.
  puntajeSilla?: number;
  puntajePantalla?: number;
  puntajeTeclado?: number;
  objetosDetectados?: string[];
}

interface EvaluationDetalles {
  silla?: number;
  pantalla?: number;
  teclado?: number;
  objetos?: string[] | string;
}

/** Parsea el JSON de EvaluationRecord.detalles; nunca lanza. */
export function parseDetalles(detalles?: string): EvaluationDetalles {
  if (!detalles) return {};
  try {
    return JSON.parse(detalles) as EvaluationDetalles;
  } catch {
    return {};
  }
}


/* =========================================================
   LLAMADA GENÉRICA
========================================================= */

async function call<T>(
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {

  if (!APPS_SCRIPT_URL) {
    throw new Error(
      "La URL del Apps Script no está configurada. Agrega VITE_APPS_SCRIPT_URL en el archivo .env"
    );
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  const data = await response.json() as { ok: boolean; error?: string; data?: T };

  if (!data.ok) {
    throw new Error(data.error ?? "Error desconocido del servidor");
  }

  return data.data as T;
}


/* =========================================================
   AUTENTICACIÓN
========================================================= */

export async function loginUser(
  email: string,
  cedula: string
): Promise<AppUser> {
  return call<AppUser>("login", { email, cedula });
}


/* =========================================================
   EVALUACIONES
========================================================= */

export async function saveEvaluation(
  record: EvaluationRecord
): Promise<void> {
  await call("saveEvaluation", { record });
}

export async function getAllEvaluations(): Promise<EvaluationRecord[]> {
  return call<EvaluationRecord[]>("getEvaluations");
}

export async function getAllUsers(): Promise<AppUser[]> {
  return call<AppUser[]>("getUsers");
}

/* =========================================================
   DATOS DE ENTRENAMIENTO
   Cada análisis guarda ángulos + landmarks + detecciones
   en la hoja "Entrenamiento" para futuro reentrenamiento.
========================================================= */

export interface TrainingRecord {
  fecha: string;
  email: string;
  // Ángulos corporales medidos
  neck: number;
  trunk: number;
  leftKnee: number;
  rightKnee: number;
  leftElbow: number;
  rightElbow: number;
  leftShoulder: number;
  rightShoulder: number;
  // Puntaje final y nivel
  puntajeFinal: number;
  nivelRiesgo: string;
  // Objetos detectados por YOLO (JSON)
  detecciones: string;
  // Número de fotos usadas
  numFotos: number;
  // Métricas del puesto
  monitorScore: number;
  deskHighStatus: string;
  phoneNearNeck: boolean;
  // Campo para revisión humana posterior
  revisadoPorExperto: string;
  correcciones: string;
}

export async function saveTrainingData(record: TrainingRecord): Promise<void> {
  // Fire-and-forget: no bloquea el flujo principal si falla
  try {
    await call("saveTraining", { record });
  } catch {
    // Silencioso — el dato de entrenamiento no debe interrumpir la UX
  }
}


/* =========================================================
   FOTOGRAFÍAS EN GOOGLE DRIVE
   Cada foto se almacena en la carpeta "ROSA Expert - Fotos",
   dentro de una subcarpeta por correo de usuario.
========================================================= */

export interface UploadedPhoto {
  fileId: string;
  url: string;
  nombre: string;
}

/** Convierte un File a base64 puro (sin el prefijo data:) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export async function uploadPhoto(
  file: File,
  email: string
): Promise<UploadedPhoto> {
  const base64 = await fileToBase64(file);
  return call<UploadedPhoto>("uploadPhoto", {
    email,
    nombreArchivo: file.name || `foto-${Date.now()}.jpg`,
    mimeType: file.type || "image/jpeg",
    base64,
  });
}
