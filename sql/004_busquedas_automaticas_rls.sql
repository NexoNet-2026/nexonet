-- ═══════════════════════════════════════════════════
-- FIX: RLS policies para busquedas_automaticas
-- Sin políticas, las queries con anon key retornan vacío
-- ═══════════════════════════════════════════════════

ALTER TABLE busquedas_automaticas ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias búsquedas
CREATE POLICY "busquedas_select_own"
  ON busquedas_automaticas FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuarios pueden crear sus propias búsquedas
CREATE POLICY "busquedas_insert_own"
  ON busquedas_automaticas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Usuarios pueden editar sus propias búsquedas
CREATE POLICY "busquedas_update_own"
  ON busquedas_automaticas FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Usuarios pueden eliminar sus propias búsquedas
CREATE POLICY "busquedas_delete_own"
  ON busquedas_automaticas FOR DELETE
  USING (auth.uid() = usuario_id);
