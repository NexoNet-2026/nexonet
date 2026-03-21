-- ═══════════════════════════════════════════════════
-- COPYRIGHT: Reclamos + campos de derechos en descargas
-- ═══════════════════════════════════════════════════

ALTER TABLE nexo_descargas ADD COLUMN IF NOT EXISTS rights_declared BOOLEAN DEFAULT FALSE;
ALTER TABLE nexo_descargas ADD COLUMN IF NOT EXISTS rights_declared_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS copyright_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  download_id UUID,
  nexo_slider_item_id UUID,
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  description TEXT NOT NULL,
  content_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT
);

ALTER TABLE copyright_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copyright_claims_select" ON copyright_claims FOR SELECT USING (true);
CREATE POLICY "copyright_claims_insert" ON copyright_claims FOR INSERT WITH CHECK (true);
