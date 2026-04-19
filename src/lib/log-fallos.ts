// src/lib/log-fallos.ts
// Helper para registrar fallos de operaciones secundarias en log_fallos_sistema.
// Diseñado para llamarse desde endpoints sin bloquear el flujo principal:
// nunca lanza excepciones, siempre deja trace en console.error.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Severidad = "critico" | "advertencia" | "info";

export interface LogFalloParams {
  severidad: Severidad;
  contexto: string;       // ej: 'asignar-bit', 'webhook-mp', 'simular-compra'
  operacion: string;      // ej: 'update_cascada_promo', 'insert_notif_final'
  usuario_id?: string | null;
  datos_contexto?: any;   // payload serializable a JSON
  error_mensaje?: string; // lo que devolvió Supabase u otro
}

let supabaseService: SupabaseClient | null = null;

function getSupabaseService(): SupabaseClient {
  if (!supabaseService) {
    supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return supabaseService;
}

function safeSerialize(value: any): any {
  if (value === undefined) return null;
  try {
    JSON.stringify(value);
    return value;
  } catch {
    return { error: "serialization_failed" };
  }
}

/**
 * Registra un fallo en log_fallos_sistema y deja trace en console.error.
 * Nunca lanza excepciones: si el insert a la tabla falla, solo loguea el meta-fallo.
 * Seguro para llamar con await desde cualquier endpoint sin afectar el flujo.
 */
export async function logFallo(params: LogFalloParams): Promise<void> {
  const { severidad, contexto, operacion, usuario_id, datos_contexto, error_mensaje } = params;

  // Siempre trace en server logs — si la tabla misma falla, acá queda evidencia
  console.error(
    `[${contexto}] [${severidad}] ${operacion}:`,
    error_mensaje ?? "",
    datos_contexto ?? null
  );

  try {
    const supabase = getSupabaseService();
    const { error } = await supabase.from("log_fallos_sistema").insert({
      severidad,
      contexto,
      operacion,
      usuario_id: usuario_id ?? null,
      datos_contexto: safeSerialize(datos_contexto),
      error_mensaje: error_mensaje ?? null,
    });
    if (error) {
      console.error(`[log-fallos] fail insert meta:`, error);
    }
  } catch (metaErr) {
    console.error(`[log-fallos] exception:`, metaErr);
  }
}
