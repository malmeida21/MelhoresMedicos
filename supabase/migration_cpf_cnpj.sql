-- Execute no SQL Editor do Supabase

ALTER TABLE medicos
  ADD COLUMN IF NOT EXISTS cpf_cnpj   TEXT,
  ADD COLUMN IF NOT EXISTS cd_externo TEXT; -- id do prestador no sistema de origem

CREATE UNIQUE INDEX IF NOT EXISTS medicos_cpf_cnpj_unique
  ON medicos (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '';

CREATE INDEX IF NOT EXISTS medicos_cd_externo_idx ON medicos (cd_externo);
