-- Um mesmo médico pode ter mais de uma especialidade.
-- O índice antigo era único só por cpf_cnpj, impedindo isso.
-- Agora a unicidade é por (cpf_cnpj, especialidade).

DROP INDEX IF EXISTS medicos_cpf_cnpj_unique;

CREATE UNIQUE INDEX IF NOT EXISTS medicos_cpf_cnpj_esp_unique
  ON medicos (cpf_cnpj, especialidade)
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '';
