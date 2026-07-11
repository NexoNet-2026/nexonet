import type { SupabaseClient } from "@supabase/supabase-js";

// Roles de nexo_miembros que pueden ejecutar acciones de administración.
const ROLES_STAFF = ["creador", "admin", "moderador"];

/**
 * Devuelve true si `solicitanteId` es staff del nexo: creador del nexo
 * (nexos.usuario_id) o miembro activo con rol creador/admin/moderador.
 * Se usa en endpoints server-side (service-role) para no depender solo de
 * la UI a la hora de autorizar acciones sobre miembros.
 */
export async function esStaffDeNexo(
  supabase: SupabaseClient,
  solicitanteId: string,
  nexoId: string
): Promise<boolean> {
  if (!solicitanteId || !nexoId) return false;

  const { data: nexo } = await supabase
    .from("nexos")
    .select("usuario_id")
    .eq("id", nexoId)
    .single();
  if (nexo?.usuario_id === solicitanteId) return true;

  const { data: miembro } = await supabase
    .from("nexo_miembros")
    .select("rol, estado")
    .eq("nexo_id", nexoId)
    .eq("usuario_id", solicitanteId)
    .maybeSingle();

  return (
    !!miembro &&
    miembro.estado === "activo" &&
    ROLES_STAFF.includes(miembro.rol)
  );
}

/**
 * Devuelve true si `usuarioId` pertenece al nexo: creador o cualquier
 * miembro registrado (sin importar el rol). Se usa para acciones de
 * autoservicio (ej. solicitar la baja de un nexo del que sos miembro).
 */
export async function esMiembroDeNexo(
  supabase: SupabaseClient,
  usuarioId: string,
  nexoId: string
): Promise<boolean> {
  if (!usuarioId || !nexoId) return false;

  const { data: nexo } = await supabase
    .from("nexos")
    .select("usuario_id")
    .eq("id", nexoId)
    .single();
  if (nexo?.usuario_id === usuarioId) return true;

  const { data: miembro } = await supabase
    .from("nexo_miembros")
    .select("id")
    .eq("nexo_id", nexoId)
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return !!miembro;
}
