-- 031_pagos_pendientes.sql
-- Cola de pagos de Mercado Pago que NO se acreditaron en el webhook:
--   estado='pending'              → MP todavía no aprobó (informativo, no se acredita BIT).
--                                   Se resuelve cuando MP manda el webhook 'approved'.
--   estado='acreditacion_fallida' → MP aprobó pero falló el update de BIT del comprador.
--                                   El cron diario (09:00 UTC) reintenta acreditar.
-- Se separa de pagos_mp a propósito: en pagos_mp una fila significa "acreditado"
-- (idempotencia), así que no se puede usar para registrar intentos fallidos.

CREATE TABLE IF NOT EXISTS public.pagos_pendientes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   text NOT NULL UNIQUE,
  usuario_id   uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  paquete      text,
  monto        numeric,
  estado       text NOT NULL DEFAULT 'pending',
  intentos     integer NOT NULL DEFAULT 0,
  resuelto     boolean NOT NULL DEFAULT false,
  ultimo_error text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para el barrido del cron (estado + no resueltos)
CREATE INDEX IF NOT EXISTS idx_pagos_pendientes_retry
  ON public.pagos_pendientes (estado, resuelto);

ALTER TABLE public.pagos_pendientes ENABLE ROW LEVEL SECURITY;

-- Solo admin puede leer desde el cliente. El webhook y el cron usan service_role,
-- que bypassa RLS, así que no necesitan policy de escritura.
CREATE POLICY "pagos_pendientes admin read" ON public.pagos_pendientes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND es_admin = true)
  );
