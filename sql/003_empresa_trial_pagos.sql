-- ═══════════════════════════════════════════════════
-- EMPRESA: Trial 30 días + pagos mensuales
-- ═══════════════════════════════════════════════════

ALTER TABLE nexos ADD COLUMN IF NOT EXISTS trial_hasta TIMESTAMPTZ;
ALTER TABLE nexos ADD COLUMN IF NOT EXISTS siguiente_pago TIMESTAMPTZ;
ALTER TABLE nexos ADD COLUMN IF NOT EXISTS plan_mensual_bits INTEGER DEFAULT 10000;

CREATE TABLE IF NOT EXISTS empresa_pagos (
  id BIGSERIAL PRIMARY KEY,
  nexo_id UUID REFERENCES nexos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  bits_pagados INTEGER DEFAULT 10000,
  periodo_desde TIMESTAMPTZ,
  periodo_hasta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE empresa_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_pagos_select" ON empresa_pagos FOR SELECT USING (true);
CREATE POLICY "empresa_pagos_insert" ON empresa_pagos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
