-- ═══════════════════════════════════════════════════
-- Admin pago pendiente: campo aprobado_por en nexo_miembros
-- ═══════════════════════════════════════════════════

ALTER TABLE nexo_miembros ADD COLUMN IF NOT EXISTS aprobado_por UUID;
