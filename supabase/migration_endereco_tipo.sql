-- Execute no SQL Editor do Supabase

ALTER TABLE medico_enderecos
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Atendimento';
